import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Import the actual API logic functions, but not Next.js handlers
import { formSubmissionSchema, feedbackSchema } from '../shared/schema';
import { riskEngine } from '../lib/riskEngine';
import { appendToSheet, getTimestamp, updateRowById, getRowById, getAggregates, getRecentRows } from '../lib/sheets';
import { storeAssessment, getAssessment, updateAssessment } from '../lib/localStorage';
import { checkRateLimit } from '../lib/rateLimiter';
import { maskEmail, getLastIpOctet } from '../lib/utils';
import { emailNotificationService } from '../lib/emailNotifications';
import { checkAdminAuth } from '../lib/auth';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import PDFDocument from 'pdfkit';

// In-memory storage for tracking start times (moved from score route)
const startTimes = new Map<string, number>();

// Helper functions to standardize responses
function jsonResponse(data: any, status = 200) {
  return { data, status };
}

function errorResponse(message: string, status = 500, errors?: any) {
  return { data: { message, errors }, status };
}

// Validation schemas
const resultReadySchema = z.object({
  id: z.string(),
});

// Helper function to check admin auth for Express requests
function checkAdminAuthExpress(req: any) {
  // Adapt the Next.js checkAdminAuth function for Express
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false };
  }
  
  const token = authHeader.slice(7);
  // Simple admin token check - in production, implement proper JWT validation
  const validToken = process.env.ADMIN_TOKEN || 'admin123';
  return { success: token === validToken };
}

// Express-native API route handlers (converted from Next.js format)
async function handleScore(req: any) {
  try {
    // Rate limiting - get IP from Express request
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || 'unknown';
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return errorResponse('Too many requests. Please try again later.', 429);
    }

    const body = req.body;
    
    // Validate input
    const validationResult = formSubmissionSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse('Invalid input data', 400, validationResult.error.errors);
    }

    const formData = validationResult.data;
    const id = randomUUID();
    const startTime = Date.now();
    
    // Store start time for later time-to-result calculation
    startTimes.set(id, startTime);

    // Calculate risk score
    const riskResult = riskEngine({
      country: formData.country,
      contractType: formData.contract_type,
      contractValue: formData.contract_value_usd,
      dataProcessing: formData.data_processing,
    });

    // Prepare row data for Google Sheets
    const rowData = {
      id,
      timestamp_iso: getTimestamp(),
      email: formData.email,
      country: formData.country,
      contract_type: formData.contract_type,
      contract_value_usd: formData.contract_value_usd,
      data_processing: formData.data_processing,
      score: riskResult.score,
      level: riskResult.level,
      time_to_result_ms: null, // Will be filled when result_ready is called
      downloaded_pdf: false,
      feedback: null,
      user_agent: req.headers['user-agent'] || '',
      ip_last_octet: getLastIpOctet(ip),
      reasons: riskResult.reasons.join('|'), // Store as pipe-separated string
    };

    // Store locally for PDF generation
    storeAssessment(rowData);
    
    // Also try to log to Google Sheets (optional)
    await appendToSheet(rowData);

    // Send email notification for high-risk assessments
    if (riskResult.level === 'High' || riskResult.score >= 8) {
      try {
        await emailNotificationService.sendHighRiskAlert({
          id,
          email: formData.email,
          country: formData.country,
          contractType: formData.contract_type,
          contractValue: formData.contract_value_usd,
          riskLevel: riskResult.level,
          riskScore: riskResult.score,
          reasons: riskResult.reasons,
          timestamp: rowData.timestamp_iso,
        });
      } catch (error) {
        // Don't fail the request if notification fails
        console.error('Failed to send high-risk notification:', error);
      }
    }

    // Return result
    return jsonResponse({
      id,
      score: riskResult.score,
      level: riskResult.level,
      reasons: riskResult.reasons,
    });

  } catch (error) {
    console.error('Score API error:', error);
    return errorResponse('Internal server error');
  }
}

async function handleResultReady(req: any) {
  try {
    const body = req.body;
    
    const validationResult = resultReadySchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse('Invalid input data', 400);
    }

    const { id } = validationResult.data;
    const startTime = startTimes.get(id);
    
    if (!startTime) {
      return errorResponse('Start time not found for this ID', 404);
    }

    const timeToResult = Date.now() - startTime;
    
    // Update the row with time to result
    await updateRowById(id, { time_to_result_ms: timeToResult });
    
    // Clean up start time
    startTimes.delete(id);

    return jsonResponse({ success: true });

  } catch (error) {
    console.error('Result ready API error:', error);
    return errorResponse('Internal server error');
  }
}

async function handleReport(req: any, res: any) {
  try {
    const { logId } = req.query;

    if (!logId) {
      res.status(400).send('Missing logId parameter');
      return;
    }

    // Get the assessment data
    let rowData = getAssessment(logId);
    if (!rowData) {
      try {
        rowData = await getRowById(logId);
      } catch (error) {
        console.log('Google Sheets not available');
      }
    }
    
    if (!rowData) {
      res.status(404).send('Assessment data not found');
      return;
    }

    // Create simple PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    // Add content
    doc.fontSize(20).text('Compliance Risk Assessment Report', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(16).text('Assessment Details');
    doc.fontSize(12);
    doc.text(`Email: ${rowData.email}`);
    doc.text(`Country: ${rowData.country}`);
    doc.text(`Contract Type: ${rowData.contract_type}`);
    doc.text(`Contract Value: $${rowData.contract_value_usd}`);
    doc.text(`Data Processing: ${rowData.data_processing ? 'Yes' : 'No'}`);
    doc.moveDown();
    doc.fontSize(16).text('Risk Assessment');
    doc.fontSize(12);
    doc.text(`Risk Level: ${rowData.level}`);
    doc.text(`Risk Score: ${rowData.score}/10`);
    doc.moveDown();
    
    if (rowData.reasons) {
      doc.fontSize(16).text('Assessment Rationale');
      doc.fontSize(12);
      const reasons = rowData.reasons.split('|');
      reasons.forEach(reason => {
        doc.text(`• ${reason}`);
      });
    }
    
    doc.end();
    
    // Get buffer
    const buffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Mark as downloaded
    try {
      updateAssessment(logId, { downloaded_pdf: true });
    } catch (error) {
      console.log('Failed to update status');
    }

    // Return as file download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${logId}.pdf"`,
    });
    res.send(buffer);

  } catch (error) {
    console.error('Report API error:', error);
    res.status(500).send('Internal server error');
  }
}

async function handleFeedback(req: any) {
  try {
    const body = req.body;
    
    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse('Invalid input data', 400);
    }

    const { id, feedback } = validationResult.data;

    // Update the row with feedback
    await updateRowById(id, { feedback });

    return jsonResponse({ success: true });

  } catch (error) {
    console.error('Feedback API error:', error);
    return errorResponse('Internal server error');
  }
}

async function handleAdminAggregates(req: any) {
  try {
    // Check admin authentication
    const authResult = checkAdminAuthExpress(req);
    if (!authResult.success) {
      return errorResponse('Unauthorized', 401);
    }

    // Get aggregated data
    const aggregates = await getAggregates();

    return jsonResponse(aggregates);

  } catch (error) {
    console.error('Admin aggregates API error:', error);
    return errorResponse('Internal server error');
  }
}

async function handleAdminRows(req: any) {
  try {
    // Check admin authentication
    const authResult = checkAdminAuthExpress(req);
    if (!authResult.success) {
      return errorResponse('Unauthorized', 401);
    }

    // Get recent rows
    const rows = await getRecentRows(20);

    // Mask emails for privacy
    const maskedRows = rows.map(row => ({
      ...row,
      maskedEmail: maskEmail(row.email),
    }));

    return jsonResponse(maskedRows);

  } catch (error) {
    console.error('Admin rows API error:', error);
    return errorResponse('Internal server error');
  }
}

export async function registerExpressRoutes(app: Express): Promise<Server> {
  // Register API routes with Express-native handlers
  app.post('/api/score', async (req, res) => {
    const result = await handleScore(req);
    res.status(result.status).json(result.data);
  });

  app.post('/api/result_ready', async (req, res) => {
    const result = await handleResultReady(req);
    res.status(result.status).json(result.data);
  });

  app.get('/api/report', async (req, res) => {
    await handleReport(req, res);
  });

  app.post('/api/feedback', async (req, res) => {
    const result = await handleFeedback(req);
    res.status(result.status).json(result.data);
  });

  // Admin routes
  app.get('/api/admin/aggregates', async (req, res) => {
    const result = await handleAdminAggregates(req);
    res.status(result.status).json(result.data);
  });

  app.get('/api/admin/rows', async (req, res) => {
    const result = await handleAdminRows(req);
    res.status(result.status).json(result.data);
  });

  // Placeholder admin routes - implement as needed
  app.get('/api/admin/time-series', async (req, res) => {
    const authResult = checkAdminAuthExpress(req);
    if (!authResult.success) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({ data: [], message: 'Time series data not implemented yet' });
  });

  app.get('/api/admin/trends', async (req, res) => {
    const authResult = checkAdminAuthExpress(req);
    if (!authResult.success) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({ data: [], message: 'Trends data not implemented yet' });
  });

  app.get('/api/admin/export-csv', async (req, res) => {
    const authResult = checkAdminAuthExpress(req);
    if (!authResult.success) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({ message: 'CSV export not implemented yet' });
  });

  app.get('/api/admin/case-study', async (req, res) => {
    const authResult = checkAdminAuthExpress(req);
    if (!authResult.success) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({ data: {}, message: 'Case study not implemented yet' });
  });

  app.get('/api/admin/export-aggregated', async (req, res) => {
    const authResult = checkAdminAuthExpress(req);
    if (!authResult.success) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({ message: 'Aggregated export not implemented yet' });
  });

  app.get('/api/admin/notifications', async (req, res) => {
    const authResult = checkAdminAuthExpress(req);
    if (!authResult.success) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({ data: [], message: 'Notifications not implemented yet' });
  });

  app.post('/api/admin/notifications', async (req, res) => {
    const authResult = checkAdminAuthExpress(req);
    if (!authResult.success) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({ success: true, message: 'Notification sent (not implemented yet)' });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create server
  const server = createServer(app);
  return server;
}

export { startTimes };
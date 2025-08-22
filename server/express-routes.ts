import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Import the actual API logic functions, but not Next.js handlers
import { formSubmissionSchema } from '../shared/schema';
import { riskEngine } from '../lib/riskEngine';
import { appendToSheet, getTimestamp } from '../lib/sheets';
import { storeAssessment } from '../lib/localStorage';
import { checkRateLimit } from '../lib/rateLimiter';
import { maskEmail, getLastIpOctet } from '../lib/utils';
import { emailNotificationService } from '../lib/emailNotifications';
import { randomUUID } from 'crypto';

// In-memory storage for tracking start times (moved from score route)
const startTimes = new Map<string, number>();

// Helper functions to standardize responses
function jsonResponse(data: any, status = 200) {
  return { data, status };
}

function errorResponse(message: string, status = 500, errors?: any) {
  return { data: { message, errors }, status };
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

export async function registerExpressRoutes(app: Express): Promise<Server> {
  // Register API routes with Express-native handlers
  app.post('/api/score', async (req, res) => {
    const result = await handleScore(req);
    res.status(result.status).json(result.data);
  });

  // Add other API routes here following the same pattern...
  // For now, let's add a simple health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create server
  const server = createServer(app);
  return server;
}

export { startTimes };
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { NextRequest, NextResponse } from 'next/server';

// Import API route handlers
import { POST as scoreHandler } from '../app/api/score/route';
import { POST as resultReadyHandler } from '../app/api/result_ready/route';
import { GET as reportHandler } from '../app/api/report/route';
import { POST as feedbackHandler } from '../app/api/feedback/route';
import { GET as aggregatesHandler } from '../app/api/admin/aggregates/route';
import { GET as rowsHandler } from '../app/api/admin/rows/route';
import { GET as timeSeriesHandler } from '../app/api/admin/time-series/route';
import { GET as trendsHandler } from '../app/api/admin/trends/route';
import { GET as exportCsvHandler } from '../app/api/admin/export-csv/route';
import { GET as caseStudyHandler } from '../app/api/admin/case-study/route';
import { GET as exportAggregatedHandler } from '../app/api/admin/export-aggregated/route';
import { GET as notificationsGetHandler, POST as notificationsPostHandler } from '../app/api/admin/notifications/route';

// Helper function to convert Express req/res to NextRequest/NextResponse
function createNextRequest(req: any): NextRequest {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Ensure IP information is properly passed through headers for Next.js compatibility
  const headers = new Headers(req.headers);
  if (req.ip) {
    headers.set('x-forwarded-for', req.ip);
  }
  if (req.connection?.remoteAddress) {
    headers.set('x-real-ip', req.connection.remoteAddress);
  }
  
  return new NextRequest(url, {
    method: req.method,
    headers: headers,
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  });
}

async function handleNextResponse(nextRes: NextResponse | Response, res: any) {
  // Set headers first
  nextRes.headers.forEach((value, key) => {
    res.set(key, value);
  });
  
  res.status(nextRes.status);
  
  // Check if this is a PDF response based on content-type
  const contentType = nextRes.headers.get('content-type');
  if (contentType && contentType.includes('application/pdf')) {
    // For PDF responses, get the binary data and send it directly
    const buffer = Buffer.from(await nextRes.arrayBuffer());
    res.send(buffer);
    return;
  }
  
  // For non-PDF responses, handle as before
  const body = await nextRes.text();
  
  // Try to parse as JSON, if successful send as JSON, otherwise send as text
  try {
    const jsonBody = JSON.parse(body);
    res.json(jsonBody);
  } catch {
    res.send(body);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes
  app.post('/api/score', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await scoreHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Score API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/result_ready', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await resultReadyHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Result ready API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/report', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await reportHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Report API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/feedback', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await feedbackHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Feedback API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin routes
  app.get('/api/admin/aggregates', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await aggregatesHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Admin aggregates API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/rows', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await rowsHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Admin rows API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/time-series', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await timeSeriesHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Admin time-series API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/trends', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await trendsHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Admin trends API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/export-csv', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await exportCsvHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Admin export-csv API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/case-study', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await caseStudyHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Admin case-study API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/export-aggregated', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await exportAggregatedHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Admin export-aggregated API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/admin/notifications', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await notificationsGetHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Admin notifications GET API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/notifications', async (req, res) => {
    try {
      const nextReq = createNextRequest(req);
      const nextRes = await notificationsPostHandler(nextReq);
      await handleNextResponse(nextRes, res);
    } catch (error) {
      console.error('Admin notifications POST API error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

import { NextRequest, NextResponse } from 'next/server';
import { formSubmissionSchema } from '../../../shared/schema';
import { riskEngine } from '../../../lib/riskEngine';
import { appendToSheet, getTimestamp } from '../../../lib/sheets';
import { checkRateLimit } from '../../../lib/rateLimiter';
import { maskEmail, getLastIpOctet } from '../../../lib/utils';
import { randomUUID } from 'crypto';

// In-memory storage for tracking start times
const startTimes = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = formSubmissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: validationResult.error.errors },
        { status: 400 }
      );
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
      user_agent: request.headers.get('user-agent') || '',
      ip_last_octet: getLastIpOctet(ip),
      reasons: riskResult.reasons.join('|'), // Store as pipe-separated string
    };

    // Log to Google Sheets
    await appendToSheet(rowData);

    // Return result
    return NextResponse.json({
      id,
      score: riskResult.score,
      level: riskResult.level,
      reasons: riskResult.reasons,
    });

  } catch (error) {
    console.error('Score API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export { startTimes };

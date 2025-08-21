import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../../lib/auth';
import { getTimeSeriesData } from '../../../../lib/analytics';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = checkAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') || 'submissions';
    const period = searchParams.get('period') || 'day';
    const days = parseInt(searchParams.get('days') || '30');

    // Get time series data
    const timeSeriesData = await getTimeSeriesData(metric, period, days);

    return NextResponse.json(timeSeriesData);

  } catch (error) {
    console.error('Time series API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../../lib/auth';
import { exportAggregatedDataToCsv } from '../../../../lib/csvExport';

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
    const includeTimeDistribution = searchParams.get('includeTimeDistribution') === 'true';
    const includeFeedbackStats = searchParams.get('includeFeedbackStats') === 'true';
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    // Generate aggregated CSV
    const csvData = await exportAggregatedDataToCsv({
      includeTimeDistribution,
      includeFeedbackStats,
      groupBy,
    });

    // Set response headers for CSV download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="compliance-aggregated-${new Date().toISOString().split('T')[0]}.csv"`);

    return new Response(csvData, { headers });

  } catch (error) {
    console.error('Aggregated CSV export error:', error);
    return NextResponse.json(
      { message: 'Export failed' },
      { status: 500 }
    );
  }
}
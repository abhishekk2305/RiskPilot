import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../../lib/auth';
import { exportRawDataToCsv } from '../../../../lib/csvExport';

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

    // Get query parameters for export customization
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'standard';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const riskLevel = searchParams.get('riskLevel');
    const country = searchParams.get('country');

    // Generate CSV
    const csvData = await exportRawDataToCsv({
      format,
      dateFrom,
      dateTo,
      riskLevel,
      country,
    });

    // Set response headers for CSV download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="compliance-data-${new Date().toISOString().split('T')[0]}.csv"`);

    return new Response(csvData, { headers });

  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { message: 'Export failed' },
      { status: 500 }
    );
  }
}
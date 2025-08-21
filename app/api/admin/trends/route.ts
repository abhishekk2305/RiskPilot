import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../../lib/auth';
import { getTrendAnalysis } from '../../../../lib/analytics';

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
    const analysisType = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || 'week';

    // Get trend analysis
    const trendData = await getTrendAnalysis(analysisType, period);

    return NextResponse.json(trendData);

  } catch (error) {
    console.error('Trends API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
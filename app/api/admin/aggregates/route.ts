import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../../lib/auth';
import { getAggregates } from '../../../../lib/sheets';

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

    // Get aggregated data
    const aggregates = await getAggregates();

    return NextResponse.json(aggregates);

  } catch (error) {
    console.error('Admin aggregates API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

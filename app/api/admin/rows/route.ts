import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../../lib/auth';
import { getRecentRows } from '../../../../lib/sheets';
import { maskEmail } from '../../../../lib/utils';

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

    // Get recent rows
    const rows = await getRecentRows(20);

    // Mask emails for privacy
    const maskedRows = rows.map(row => ({
      ...row,
      maskedEmail: maskEmail(row.email),
    }));

    return NextResponse.json(maskedRows);

  } catch (error) {
    console.error('Admin rows API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

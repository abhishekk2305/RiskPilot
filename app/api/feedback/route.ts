import { NextRequest, NextResponse } from 'next/server';
import { feedbackSchema } from '../../../shared/schema';
import { updateRowById } from '../../../lib/sheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input data' },
        { status: 400 }
      );
    }

    const { id, feedback } = validationResult.data;

    // Update the row with feedback
    await updateRowById(id, { feedback });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

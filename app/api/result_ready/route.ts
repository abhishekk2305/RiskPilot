import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { updateRowById } from '../../../lib/sheets';
import { startTimes } from '../score/route';

const resultReadySchema = z.object({
  id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = resultReadySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input data' },
        { status: 400 }
      );
    }

    const { id } = validationResult.data;
    const startTime = startTimes.get(id);
    
    if (!startTime) {
      return NextResponse.json(
        { message: 'Start time not found for this ID' },
        { status: 404 }
      );
    }

    const timeToResult = Date.now() - startTime;
    
    // Update the row with time to result
    await updateRowById(id, { time_to_result_ms: timeToResult });
    
    // Clean up start time
    startTimes.delete(id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Result ready API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

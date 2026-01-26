import { NextRequest, NextResponse } from 'next/server';
import { getWorkoutTemplates, createWorkoutTemplate } from '../../../lib/storage';

export async function GET() {
  const workouts = getWorkoutTemplates();
  return NextResponse.json({
    success: true,
    workouts,
  });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const workout = createWorkoutTemplate(data);

    return NextResponse.json({
      success: true,
      workout,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create workout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create workout' },
      { status: 500 }
    );
  }
}

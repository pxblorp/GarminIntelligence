import { NextRequest, NextResponse } from 'next/server';
import { getWorkoutTemplate, updateWorkoutTemplate, deleteWorkoutTemplate } from '../../../../lib/storage';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const workout = getWorkoutTemplate(id);

  if (!workout) {
    return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    workout,
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await request.json();

    if (!data) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const workout = updateWorkoutTemplate(id, data);

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      workout,
    });
  } catch (error) {
    console.error('Failed to update workout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update workout' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const deleted = deleteWorkoutTemplate(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Workout deleted',
  });
}

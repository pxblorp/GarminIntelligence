import { NextRequest, NextResponse } from 'next/server';
import { getWorkoutTemplate, updateWorkoutTemplate, deleteWorkoutTemplate } from '../../../../lib/storage';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const workout = await getWorkoutTemplate(id);

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      workout,
    });
  } catch (error) {
    console.error('Failed to fetch workout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch workout' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await request.json();

    if (!data) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const workout = await updateWorkoutTemplate(id, data);

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
  try {
    const { id } = await context.params;
    const deleted = await deleteWorkoutTemplate(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Workout deleted',
    });
  } catch (error) {
    console.error('Failed to delete workout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete workout' },
      { status: 500 }
    );
  }
}

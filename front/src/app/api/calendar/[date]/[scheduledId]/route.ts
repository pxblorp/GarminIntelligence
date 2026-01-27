import { NextRequest, NextResponse } from 'next/server';
import { unscheduleWorkout } from '../../../../../lib/storage';

type RouteContext = {
  params: Promise<{ date: string; scheduledId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { date, scheduledId } = await context.params;

    const deleted = await unscheduleWorkout(date, scheduledId);

    if (!deleted) {
      return NextResponse.json({ error: 'Scheduled workout not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Workout unscheduled',
    });
  } catch (error) {
    console.error('Failed to unschedule workout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unschedule workout' },
      { status: 500 }
    );
  }
}

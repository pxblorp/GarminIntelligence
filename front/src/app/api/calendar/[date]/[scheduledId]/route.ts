import { NextRequest, NextResponse } from 'next/server';
import { unscheduleWorkout } from '../../../../../lib/storage';

type RouteContext = {
  params: Promise<{ date: string; scheduledId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { date, scheduledId } = await context.params;

  const deleted = unscheduleWorkout(date, scheduledId);

  if (!deleted) {
    return NextResponse.json({ error: 'Scheduled workout not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: 'Workout unscheduled',
  });
}

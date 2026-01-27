import { NextRequest, NextResponse } from 'next/server';
import { getScheduledWorkouts, scheduleWorkout } from '../../../lib/storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const calendarMap = await getScheduledWorkouts(startDate, endDate);

    // Convert Map to plain object
    const calendar: Record<string, unknown[]> = {};
    let weeklyLoad = 0;

    for (const [date, workouts] of calendarMap.entries()) {
      calendar[date] = workouts;
      weeklyLoad += workouts.reduce((sum, w) => sum + (w.estimatedLoad || 0), 0);
    }

    return NextResponse.json({
      success: true,
      calendar,
      weeklyLoad,
    });
  } catch (error) {
    console.error('Failed to fetch calendar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    const { date, workoutId, workout } = data;

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (!workoutId && !workout) {
      return NextResponse.json(
        { error: 'Either workoutId or workout is required' },
        { status: 400 }
      );
    }

    const scheduled = await scheduleWorkout(date, workoutId || workout);

    return NextResponse.json({
      success: true,
      scheduled,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to schedule workout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to schedule workout' },
      { status: 500 }
    );
  }
}

import type { Workout, ScheduledWorkout, WeekCalendar } from '../types/Workout';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// ============================================================================
// WORKOUT TEMPLATES API
// ============================================================================

export async function getWorkouts(): Promise<Workout[]> {
  const response = await fetch(`${BACKEND_URL}/api/workouts`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch workouts');
  }

  return data.workouts;
}

export async function createWorkout(
  workout: Omit<Workout, 'id'>
): Promise<Workout> {
  const response = await fetch(`${BACKEND_URL}/api/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create workout');
  }

  return data.workout;
}

export async function updateWorkout(
  id: string,
  workout: Partial<Workout>
): Promise<Workout> {
  const response = await fetch(`${BACKEND_URL}/api/workouts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workout),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update workout');
  }

  return data.workout;
}

export async function deleteWorkout(id: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/workouts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete workout');
  }
}

// ============================================================================
// CALENDAR API
// ============================================================================

export async function getCalendar(
  startDate: string,
  endDate: string
): Promise<{ calendar: WeekCalendar; weeklyLoad: number }> {
  const response = await fetch(
    `${BACKEND_URL}/api/calendar?start_date=${startDate}&end_date=${endDate}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch calendar');
  }

  return { calendar: data.calendar, weeklyLoad: data.weeklyLoad };
}

export async function scheduleWorkout(
  date: string,
  workoutOrId: Workout | string
): Promise<ScheduledWorkout> {
  const body =
    typeof workoutOrId === 'string'
      ? { date, workoutId: workoutOrId }
      : { date, workout: workoutOrId };

  const response = await fetch(`${BACKEND_URL}/api/calendar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to schedule workout');
  }

  return data.scheduled;
}

export async function unscheduleWorkout(
  date: string,
  scheduledId: string
): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/api/calendar/${date}/${scheduledId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to unschedule workout');
  }
}

// ============================================================================
// EXPORT API
// ============================================================================

export async function exportWeek(startDate: string): Promise<Blob> {
  const response = await fetch(
    `${BACKEND_URL}/api/export/week?start_date=${startDate}`
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to export week');
  }

  return response.blob();
}

export async function exportSingleWorkout(scheduledId: string): Promise<Blob> {
  const response = await fetch(
    `${BACKEND_URL}/api/export/workout/${scheduledId}`
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to export workout');
  }

  return response.blob();
}

// Helper to trigger download
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

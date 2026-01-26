import type { Workout, ScheduledWorkout } from '../types/Workout';

// In-memory storage for workout planner
// In production, you'd use a database like Vercel KV, Postgres, etc.

// Workout templates (reusable workouts)
const workoutTemplates: Map<string, Workout> = new Map();

// Scheduled workouts (workouts assigned to specific dates)
const scheduledWorkouts: Map<string, ScheduledWorkout[]> = new Map();

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Calculate estimated training load for a workout
export function calculateWorkoutLoad(workout: Partial<Workout>): number {
  let totalDuration = 0;
  let weightedIntensity = 0;

  for (const step of workout.steps || []) {
    if (step.type === 'interval') {
      const repeats = step.repeat || 1;
      const onDuration = step.on?.duration || 0;
      const offDuration = step.off?.duration || 0;
      const onZone = step.on?.zone || 3;
      const offZone = step.off?.zone || 2;

      const intervalDuration = repeats * (onDuration + offDuration);
      totalDuration += intervalDuration;
      weightedIntensity += repeats * (onDuration * onZone + offDuration * offZone);
    } else {
      const duration = step.duration || 0;
      const zone = step.zone || 2;
      totalDuration += duration;
      weightedIntensity += duration * zone;
    }
  }

  if (totalDuration === 0) return 0;

  const avgIntensity = weightedIntensity / totalDuration;
  const rpe = workout.rpe || 5;
  const durationMinutes = totalDuration / 60;
  const load = durationMinutes * (avgIntensity * 0.3 + rpe * 0.7);

  return Math.round(load * 10) / 10;
}

// Workout templates CRUD
export function getWorkoutTemplates(): Workout[] {
  return Array.from(workoutTemplates.values());
}

export function getWorkoutTemplate(id: string): Workout | undefined {
  return workoutTemplates.get(id);
}

export function createWorkoutTemplate(data: Omit<Workout, 'id'>): Workout {
  const id = generateId();
  const workout: Workout = {
    id,
    sport: data.sport || 'other',
    name: data.name || 'Untitled Workout',
    steps: data.steps || [],
    rpe: data.rpe || 5,
    notes: data.notes || '',
    estimatedLoad: calculateWorkoutLoad(data),
    createdAt: new Date().toISOString(),
  };
  workoutTemplates.set(id, workout);
  return workout;
}

export function updateWorkoutTemplate(id: string, data: Partial<Workout>): Workout | null {
  const existing = workoutTemplates.get(id);
  if (!existing) return null;

  const updated: Workout = {
    ...existing,
    sport: data.sport ?? existing.sport,
    name: data.name ?? existing.name,
    steps: data.steps ?? existing.steps,
    rpe: data.rpe ?? existing.rpe,
    notes: data.notes ?? existing.notes,
    estimatedLoad: calculateWorkoutLoad({ ...existing, ...data }),
    updatedAt: new Date().toISOString(),
  };
  workoutTemplates.set(id, updated);
  return updated;
}

export function deleteWorkoutTemplate(id: string): boolean {
  return workoutTemplates.delete(id);
}

// Scheduled workouts CRUD
export function getScheduledWorkouts(startDate: string, endDate: string): Map<string, ScheduledWorkout[]> {
  const result = new Map<string, ScheduledWorkout[]>();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    result.set(dateStr, scheduledWorkouts.get(dateStr) || []);
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export function scheduleWorkout(date: string, workoutData: Workout | string): ScheduledWorkout {
  let workout: Workout;

  if (typeof workoutData === 'string') {
    const template = workoutTemplates.get(workoutData);
    if (!template) {
      throw new Error('Workout template not found');
    }
    workout = { ...template };
  } else {
    workout = {
      id: workoutData.id || generateId(),
      sport: workoutData.sport || 'other',
      name: workoutData.name || 'Untitled Workout',
      steps: workoutData.steps || [],
      rpe: workoutData.rpe || 5,
      notes: workoutData.notes || '',
      estimatedLoad: calculateWorkoutLoad(workoutData),
    };
  }

  const scheduled: ScheduledWorkout = {
    ...workout,
    date,
    scheduledId: generateId(),
  };

  const existing = scheduledWorkouts.get(date) || [];
  existing.push(scheduled);
  scheduledWorkouts.set(date, existing);

  return scheduled;
}

export function unscheduleWorkout(date: string, scheduledId: string): boolean {
  const workouts = scheduledWorkouts.get(date);
  if (!workouts) return false;

  const filtered = workouts.filter(w => w.scheduledId !== scheduledId);
  if (filtered.length === workouts.length) return false;

  if (filtered.length === 0) {
    scheduledWorkouts.delete(date);
  } else {
    scheduledWorkouts.set(date, filtered);
  }

  return true;
}

export function getScheduledWorkoutById(scheduledId: string): { workout: ScheduledWorkout; date: string } | null {
  for (const [date, workouts] of scheduledWorkouts.entries()) {
    const workout = workouts.find(w => w.scheduledId === scheduledId);
    if (workout) {
      return { workout, date };
    }
  }
  return null;
}

export function getAllScheduledWorkoutsForWeek(startDate: string): Array<{ date: string; workout: ScheduledWorkout }> {
  const result: Array<{ date: string; workout: ScheduledWorkout }> = [];
  const start = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const workouts = scheduledWorkouts.get(dateStr) || [];
    for (const workout of workouts) {
      result.push({ date: dateStr, workout });
    }
  }

  return result;
}

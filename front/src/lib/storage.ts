import type { Workout, ScheduledWorkout, WorkoutStep } from '../types/Workout';
import { getDb, isDatabaseConfigured, initializeDatabase } from './db';

// In-memory fallback storage (used when database is not configured)
const memoryWorkoutTemplates: Map<string, Workout> = new Map();
const memoryScheduledWorkouts: Map<string, ScheduledWorkout[]> = new Map();

// Database initialization flag
let dbInitialized = false;

async function ensureDbInitialized(): Promise<void> {
  if (!dbInitialized && isDatabaseConfigured()) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

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

// ============================================================================
// WORKOUT TEMPLATES
// ============================================================================

export async function getWorkoutTemplates(): Promise<Workout[]> {
  if (!isDatabaseConfigured()) {
    return Array.from(memoryWorkoutTemplates.values());
  }

  await ensureDbInitialized();
  const db = getDb();
  const result = await db.execute('SELECT * FROM workout_templates ORDER BY created_at DESC');

  return result.rows.map((row) => ({
    id: row.id as string,
    sport: row.sport as Workout['sport'],
    name: row.name as string,
    steps: JSON.parse(row.steps as string) as WorkoutStep[],
    rpe: row.rpe as number,
    notes: row.notes as string | undefined,
    estimatedLoad: row.estimated_load as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined,
  }));
}

export async function getWorkoutTemplate(id: string): Promise<Workout | undefined> {
  if (!isDatabaseConfigured()) {
    return memoryWorkoutTemplates.get(id);
  }

  await ensureDbInitialized();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM workout_templates WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return undefined;

  const row = result.rows[0];
  return {
    id: row.id as string,
    sport: row.sport as Workout['sport'],
    name: row.name as string,
    steps: JSON.parse(row.steps as string) as WorkoutStep[],
    rpe: row.rpe as number,
    notes: row.notes as string | undefined,
    estimatedLoad: row.estimated_load as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined,
  };
}

export async function createWorkoutTemplate(data: Omit<Workout, 'id'>): Promise<Workout> {
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

  if (!isDatabaseConfigured()) {
    memoryWorkoutTemplates.set(id, workout);
    return workout;
  }

  await ensureDbInitialized();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO workout_templates (id, sport, name, steps, rpe, notes, estimated_load, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      workout.id,
      workout.sport,
      workout.name,
      JSON.stringify(workout.steps),
      workout.rpe,
      workout.notes ?? null,
      workout.estimatedLoad ?? null,
      workout.createdAt!,
    ],
  });

  return workout;
}

export async function updateWorkoutTemplate(id: string, data: Partial<Workout>): Promise<Workout | null> {
  if (!isDatabaseConfigured()) {
    const existing = memoryWorkoutTemplates.get(id);
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
    memoryWorkoutTemplates.set(id, updated);
    return updated;
  }

  await ensureDbInitialized();
  const existing = await getWorkoutTemplate(id);
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

  const db = getDb();
  await db.execute({
    sql: `UPDATE workout_templates
          SET sport = ?, name = ?, steps = ?, rpe = ?, notes = ?, estimated_load = ?, updated_at = ?
          WHERE id = ?`,
    args: [
      updated.sport,
      updated.name,
      JSON.stringify(updated.steps),
      updated.rpe,
      updated.notes ?? null,
      updated.estimatedLoad ?? null,
      updated.updatedAt!,
      id,
    ],
  });

  return updated;
}

export async function deleteWorkoutTemplate(id: string): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return memoryWorkoutTemplates.delete(id);
  }

  await ensureDbInitialized();
  const db = getDb();
  const result = await db.execute({
    sql: 'DELETE FROM workout_templates WHERE id = ?',
    args: [id],
  });

  return result.rowsAffected > 0;
}

// ============================================================================
// SCHEDULED WORKOUTS
// ============================================================================

export async function getScheduledWorkouts(
  startDate: string,
  endDate: string
): Promise<Map<string, ScheduledWorkout[]>> {
  const result = new Map<string, ScheduledWorkout[]>();

  // Initialize all dates in range with empty arrays
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    result.set(dateStr, []);
    current.setDate(current.getDate() + 1);
  }

  if (!isDatabaseConfigured()) {
    for (const [date, workouts] of memoryScheduledWorkouts.entries()) {
      if (date >= startDate && date <= endDate) {
        result.set(date, workouts);
      }
    }
    return result;
  }

  await ensureDbInitialized();
  const db = getDb();
  const dbResult = await db.execute({
    sql: 'SELECT * FROM scheduled_workouts WHERE date >= ? AND date <= ? ORDER BY date, created_at',
    args: [startDate, endDate],
  });

  for (const row of dbResult.rows) {
    const date = row.date as string;
    const workout: ScheduledWorkout = {
      id: row.workout_id as string,
      scheduledId: row.scheduled_id as string,
      date: date,
      sport: row.sport as Workout['sport'],
      name: row.name as string,
      steps: JSON.parse(row.steps as string) as WorkoutStep[],
      rpe: row.rpe as number,
      notes: row.notes as string | undefined,
      estimatedLoad: row.estimated_load as number | undefined,
    };

    const dateWorkouts = result.get(date) || [];
    dateWorkouts.push(workout);
    result.set(date, dateWorkouts);
  }

  return result;
}

export async function scheduleWorkout(date: string, workoutData: Workout | string): Promise<ScheduledWorkout> {
  let workout: Workout;

  if (typeof workoutData === 'string') {
    const template = await getWorkoutTemplate(workoutData);
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

  if (!isDatabaseConfigured()) {
    const existing = memoryScheduledWorkouts.get(date) || [];
    existing.push(scheduled);
    memoryScheduledWorkouts.set(date, existing);
    return scheduled;
  }

  await ensureDbInitialized();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO scheduled_workouts
          (scheduled_id, date, workout_id, sport, name, steps, rpe, notes, estimated_load, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      scheduled.scheduledId,
      scheduled.date,
      scheduled.id,
      scheduled.sport,
      scheduled.name,
      JSON.stringify(scheduled.steps),
      scheduled.rpe,
      scheduled.notes ?? null,
      scheduled.estimatedLoad ?? null,
      new Date().toISOString(),
    ],
  });

  return scheduled;
}

export async function unscheduleWorkout(date: string, scheduledId: string): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    const workouts = memoryScheduledWorkouts.get(date);
    if (!workouts) return false;

    const filtered = workouts.filter((w) => w.scheduledId !== scheduledId);
    if (filtered.length === workouts.length) return false;

    if (filtered.length === 0) {
      memoryScheduledWorkouts.delete(date);
    } else {
      memoryScheduledWorkouts.set(date, filtered);
    }
    return true;
  }

  await ensureDbInitialized();
  const db = getDb();
  const result = await db.execute({
    sql: 'DELETE FROM scheduled_workouts WHERE scheduled_id = ? AND date = ?',
    args: [scheduledId, date],
  });

  return result.rowsAffected > 0;
}

export async function getScheduledWorkoutById(
  scheduledId: string
): Promise<{ workout: ScheduledWorkout; date: string } | null> {
  if (!isDatabaseConfigured()) {
    for (const [date, workouts] of memoryScheduledWorkouts.entries()) {
      const workout = workouts.find((w) => w.scheduledId === scheduledId);
      if (workout) {
        return { workout, date };
      }
    }
    return null;
  }

  await ensureDbInitialized();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM scheduled_workouts WHERE scheduled_id = ?',
    args: [scheduledId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const workout: ScheduledWorkout = {
    id: row.workout_id as string,
    scheduledId: row.scheduled_id as string,
    date: row.date as string,
    sport: row.sport as Workout['sport'],
    name: row.name as string,
    steps: JSON.parse(row.steps as string) as WorkoutStep[],
    rpe: row.rpe as number,
    notes: row.notes as string | undefined,
    estimatedLoad: row.estimated_load as number | undefined,
  };

  return { workout, date: row.date as string };
}

export async function getAllScheduledWorkoutsForWeek(
  startDate: string
): Promise<Array<{ date: string; workout: ScheduledWorkout }>> {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const endDateStr = endDate.toISOString().split('T')[0];

  const calendarMap = await getScheduledWorkouts(startDate, endDateStr);
  const result: Array<{ date: string; workout: ScheduledWorkout }> = [];

  for (const [date, workouts] of calendarMap.entries()) {
    for (const workout of workouts) {
      result.push({ date, workout });
    }
  }

  return result;
}

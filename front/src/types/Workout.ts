export type WorkoutStepTarget = {
  type: 'hr' | 'pace' | 'power' | 'open';
  zone?: number; // HR/power zone (1-5)
  value?: number; // Specific target value
};

export type IntervalStep = {
  duration: number; // seconds
  zone?: number; // HR zone (1-5)
  target?: WorkoutStepTarget;
};

export type WorkoutStep = {
  type: 'warmup' | 'cooldown' | 'interval' | 'recovery' | 'active';
  duration?: number; // seconds (for non-interval steps)
  zone?: number; // HR zone (1-5)
  target?: WorkoutStepTarget;
  // Interval-specific fields
  repeat?: number; // Number of repeats
  on?: IntervalStep; // Work interval
  off?: IntervalStep; // Recovery interval
  notes?: string; // Step-specific notes
};

export type Workout = {
  id: string;
  sport: 'run' | 'bike' | 'swim' | 'strength' | 'yoga' | 'sail' | 'other';
  name: string;
  steps: WorkoutStep[];
  rpe: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
  estimatedLoad?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ScheduledWorkout = Workout & {
  date: string; // YYYY-MM-DD
  scheduledId: string;
};

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  workouts: ScheduledWorkout[];
  totalLoad: number;
};

export type WeekCalendar = {
  [date: string]: ScheduledWorkout[];
};

// Sport options for the UI
export const SPORT_OPTIONS = [
  { value: 'run', label: 'Run', color: 'bg-green-500' },
  { value: 'bike', label: 'Bike', color: 'bg-blue-500' },
  { value: 'swim', label: 'Swim', color: 'bg-cyan-500' },
  { value: 'strength', label: 'Strength', color: 'bg-orange-500' },
  { value: 'yoga', label: 'Yoga', color: 'bg-purple-500' },
  { value: 'sail', label: 'Sail', color: 'bg-indigo-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
] as const;

// Step type options
export const STEP_TYPE_OPTIONS = [
  { value: 'warmup', label: 'Warm-up' },
  { value: 'active', label: 'Active' },
  { value: 'interval', label: 'Intervals' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'cooldown', label: 'Cool-down' },
] as const;

// HR Zone descriptions
export const HR_ZONES = [
  { zone: 1, name: 'Recovery', range: '50-60%', color: 'bg-blue-200' },
  { zone: 2, name: 'Endurance', range: '60-70%', color: 'bg-green-200' },
  { zone: 3, name: 'Tempo', range: '70-80%', color: 'bg-yellow-200' },
  { zone: 4, name: 'Threshold', range: '80-90%', color: 'bg-orange-200' },
  { zone: 5, name: 'VO2max', range: '90-100%', color: 'bg-red-200' },
] as const;

export type WorkoutStepTarget = {
  type: 'hr' | 'pace' | 'power' | 'open';
  zone?: number;       // Zone (1-5)
  value?: number;      // Specific target value
};

export type IntervalStep = {
  duration: number;    // seconds
  zone?: number;       // Zone (1-5)
  target?: WorkoutStepTarget;
};

export type WorkoutStep = {
  type: 'warmup' | 'cooldown' | 'interval' | 'recovery' | 'active';
  duration?: number;   // seconds (for non-interval steps)
  zone?: number;       // Zone (1-5)
  target?: WorkoutStepTarget;
  // Interval-specific fields
  repeat?: number;     // Number of repeats
  on?: IntervalStep;   // Work interval
  off?: IntervalStep;  // Recovery interval
  notes?: string;      // Step-specific notes/description
};

export type Workout = {
  id: string;
  sport: 'run' | 'bike' | 'swim' | 'strength' | 'yoga' | 'sail' | 'other';
  name: string;
  steps: WorkoutStep[];
  rpe: number;         // Rate of Perceived Exertion (1-10)
  notes?: string;
  estimatedLoad?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ScheduledWorkout = Workout & {
  date: string;        // YYYY-MM-DD
  scheduledId: string;
};

export type CalendarDay = {
  date: string;        // YYYY-MM-DD
  workouts: ScheduledWorkout[];
  totalLoad: number;
};

export type WeekCalendar = {
  [date: string]: ScheduledWorkout[];
};

// Sport options for the UI with zone type
export const SPORT_OPTIONS = [
  { value: 'run', label: 'Run', color: 'bg-green-500', zoneType: 'pace' as const },
  { value: 'bike', label: 'Bike', color: 'bg-blue-500', zoneType: 'power' as const },
  { value: 'swim', label: 'Swim', color: 'bg-cyan-500', zoneType: 'hr' as const },
  { value: 'strength', label: 'Strength', color: 'bg-orange-500', zoneType: 'none' as const },
  { value: 'yoga', label: 'Yoga', color: 'bg-purple-500', zoneType: 'none' as const },
  { value: 'sail', label: 'Sail', color: 'bg-indigo-500', zoneType: 'none' as const },
  { value: 'other', label: 'Other', color: 'bg-gray-500', zoneType: 'none' as const },
] as const;

// Step type options
export const STEP_TYPE_OPTIONS = [
  { value: 'warmup', label: 'Warm-up' },
  { value: 'active', label: 'Active' },
  { value: 'interval', label: 'Intervals' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'cooldown', label: 'Cool-down' },
] as const;

// Running Pace Zones (min/km examples)
export const PACE_ZONES = [
  { zone: 1, name: 'Recovery', range: '6:30+', color: 'bg-blue-200' },
  { zone: 2, name: 'Easy', range: '5:45-6:30', color: 'bg-green-200' },
  { zone: 3, name: 'Tempo', range: '5:00-5:45', color: 'bg-yellow-200' },
  { zone: 4, name: 'Threshold', range: '4:30-5:00', color: 'bg-orange-200' },
  { zone: 5, name: 'VO2max', range: '< 4:30', color: 'bg-red-200' },
] as const;

// Bike Power Zones (% FTP)
export const POWER_ZONES = [
  { zone: 1, name: 'Active Recovery', range: '< 55%', color: 'bg-blue-200' },
  { zone: 2, name: 'Endurance', range: '55-75%', color: 'bg-green-200' },
  { zone: 3, name: 'Tempo', range: '76-90%', color: 'bg-yellow-200' },
  { zone: 4, name: 'Threshold', range: '91-105%', color: 'bg-orange-200' },
  { zone: 5, name: 'VO2max', range: '106-120%', color: 'bg-red-200' },
] as const;

// HR Zone descriptions (for swim and fallback)
export const HR_ZONES = [
  { zone: 1, name: 'Recovery', range: '50-60%', color: 'bg-blue-200' },
  { zone: 2, name: 'Endurance', range: '60-70%', color: 'bg-green-200' },
  { zone: 3, name: 'Tempo', range: '70-80%', color: 'bg-yellow-200' },
  { zone: 4, name: 'Threshold', range: '80-90%', color: 'bg-orange-200' },
  { zone: 5, name: 'VO2max', range: '90-100%', color: 'bg-red-200' },
] as const;

// Helper to get zones for a sport
export function getZonesForSport(sport: string) {
  const sportOption = SPORT_OPTIONS.find(s => s.value === sport);
  if (!sportOption || sportOption.zoneType === 'none') return null;

  switch (sportOption.zoneType) {
    case 'pace': return PACE_ZONES;
    case 'power': return POWER_ZONES;
    default: return HR_ZONES;
  }
}

// Helper to get zone label for a sport
export function getZoneLabelForSport(sport: string): string {
  const sportOption = SPORT_OPTIONS.find(s => s.value === sport);
  if (!sportOption || sportOption.zoneType === 'none') return '';

  switch (sportOption.zoneType) {
    case 'pace': return 'Pace Zone';
    case 'power': return 'Power Zone';
    default: return 'HR Zone';
  }
}

// Check if sport uses zones
export function sportUsesZones(sport: string): boolean {
  const sportOption = SPORT_OPTIONS.find(s => s.value === sport);
  return sportOption?.zoneType !== 'none';
}

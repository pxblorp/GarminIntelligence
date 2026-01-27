// User-customizable training zones

export type ZoneType = 'hr' | 'pace' | 'power';

export type Zone = {
  zone: number;      // 1-5
  name: string;      // e.g., "Recovery", "Endurance"
  min: number;       // Minimum value (bpm, sec/km, watts)
  max: number;       // Maximum value
};

export type UserZones = {
  id: string;
  userId: string;    // For future multi-user support, use 'default' for now
  type: ZoneType;
  zones: Zone[];
  updatedAt: string;
};

// Default HR zones (percentage of max HR, stored as bpm assuming 190 max)
export const DEFAULT_HR_ZONES: Zone[] = [
  { zone: 1, name: 'Recovery', min: 95, max: 114 },      // 50-60%
  { zone: 2, name: 'Endurance', min: 114, max: 133 },    // 60-70%
  { zone: 3, name: 'Tempo', min: 133, max: 152 },        // 70-80%
  { zone: 4, name: 'Threshold', min: 152, max: 171 },    // 80-90%
  { zone: 5, name: 'VO2max', min: 171, max: 190 },       // 90-100%
];

// Default pace zones (seconds per km)
export const DEFAULT_PACE_ZONES: Zone[] = [
  { zone: 1, name: 'Recovery', min: 390, max: 480 },     // 6:30-8:00 min/km
  { zone: 2, name: 'Easy', min: 345, max: 390 },         // 5:45-6:30 min/km
  { zone: 3, name: 'Tempo', min: 300, max: 345 },        // 5:00-5:45 min/km
  { zone: 4, name: 'Threshold', min: 270, max: 300 },    // 4:30-5:00 min/km
  { zone: 5, name: 'VO2max', min: 240, max: 270 },       // 4:00-4:30 min/km
];

// Default power zones (watts, based on 250W FTP)
export const DEFAULT_POWER_ZONES: Zone[] = [
  { zone: 1, name: 'Active Recovery', min: 0, max: 137 },    // <55% FTP
  { zone: 2, name: 'Endurance', min: 137, max: 187 },        // 55-75% FTP
  { zone: 3, name: 'Tempo', min: 187, max: 225 },            // 75-90% FTP
  { zone: 4, name: 'Threshold', min: 225, max: 262 },        // 90-105% FTP
  { zone: 5, name: 'VO2max', min: 262, max: 300 },           // 105-120% FTP
];

// Get default zones by type
export function getDefaultZones(type: ZoneType): Zone[] {
  switch (type) {
    case 'hr':
      return [...DEFAULT_HR_ZONES];
    case 'pace':
      return [...DEFAULT_PACE_ZONES];
    case 'power':
      return [...DEFAULT_POWER_ZONES];
  }
}

// Format pace for display (seconds to mm:ss)
export function formatPace(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Parse pace from mm:ss to seconds
export function parsePace(pace: string): number {
  const [mins, secs] = pace.split(':').map(Number);
  return (mins || 0) * 60 + (secs || 0);
}

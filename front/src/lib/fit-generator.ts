import { Encoder, Profile } from '@garmin/fitsdk';
import type { ScheduledWorkout, WorkoutStep } from '../types/Workout';
import type { Zone } from '../types/Zones';

// Sport mapping for FIT file
const SPORT_MAP: Record<string, { sport: string; subSport: string }> = {
  run: { sport: 'running', subSport: 'generic' },
  running: { sport: 'running', subSport: 'generic' },
  bike: { sport: 'cycling', subSport: 'generic' },
  cycling: { sport: 'cycling', subSport: 'generic' },
  swim: { sport: 'swimming', subSport: 'generic' },
  swimming: { sport: 'swimming', subSport: 'generic' },
  strength: { sport: 'training', subSport: 'strengthTraining' },
  yoga: { sport: 'training', subSport: 'yoga' },
  sail: { sport: 'generic', subSport: 'generic' },
  sailing: { sport: 'generic', subSport: 'generic' },
  other: { sport: 'generic', subSport: 'generic' },
};

// Intensity mapping
const INTENSITY_MAP: Record<string, string> = {
  warmup: 'warmup',
  cooldown: 'cooldown',
  recovery: 'recovery',
  active: 'active',
  interval: 'interval',
};

// Target type based on sport
function getTargetTypeForSport(sport: string): 'heartRate' | 'speed' | 'power' {
  switch (sport.toLowerCase()) {
    case 'run':
    case 'running':
      return 'speed'; // Pace zones
    case 'bike':
    case 'cycling':
      return 'power'; // Power zones
    default:
      return 'heartRate'; // HR zones
  }
}

// Get zone values from user zones or defaults
function getZoneValues(
  zone: number,
  sport: string,
  userZones?: { hr?: Zone[]; pace?: Zone[]; power?: Zone[] }
): { low: number; high: number; targetType: 'heartRate' | 'speed' | 'power' } {
  const targetType = getTargetTypeForSport(sport);

  let zones: Zone[] | undefined;
  switch (targetType) {
    case 'speed':
      zones = userZones?.pace;
      break;
    case 'power':
      zones = userZones?.power;
      break;
    default:
      zones = userZones?.hr;
  }

  // Find zone by number
  const zoneData = zones?.find((z) => z.zone === zone);

  if (zoneData) {
    if (targetType === 'speed') {
      // Convert pace (sec/km) to speed (m/s * 1000 for FIT format)
      // pace in sec/km -> speed in m/s = 1000 / pace
      const speedLow = Math.round((1000 / zoneData.max) * 1000);
      const speedHigh = Math.round((1000 / zoneData.min) * 1000);
      return { low: speedLow, high: speedHigh, targetType };
    }
    if (targetType === 'power') {
      return { low: zoneData.min, high: zoneData.max, targetType };
    }
    // HR zones - add 100 offset for Garmin format
    return { low: zoneData.min + 100, high: zoneData.max + 100, targetType };
  }

  // Default zones if not found
  const defaultHR: Record<number, [number, number]> = {
    1: [150, 160],
    2: [160, 170],
    3: [170, 180],
    4: [180, 190],
    5: [190, 200],
  };
  const [low, high] = defaultHR[zone] || [160, 170];
  return { low, high, targetType: 'heartRate' };
}

// Count total steps including interval expansions
function countWorkoutSteps(steps: WorkoutStep[]): number {
  let count = 0;
  for (const step of steps) {
    if (step.type === 'interval') {
      const repeats = step.repeat || 1;
      count += repeats * 2; // on + off for each repeat
    } else {
      count += 1;
    }
  }
  return count;
}

export type UserZonesForFit = {
  hr?: Zone[];
  pace?: Zone[];
  power?: Zone[];
};

export function generateFitWorkout(
  workout: ScheduledWorkout,
  userZones?: UserZonesForFit
): Uint8Array {
  const encoder = new Encoder();
  const sportKey = workout.sport?.toLowerCase() || 'other';
  const sportInfo = SPORT_MAP[sportKey] || SPORT_MAP.other;

  // File ID message
  encoder.onMesg(Profile.MesgNum.FILE_ID, {
    type: 'workout',
    manufacturer: 'garmin',
    product: 65534,
    serialNumber: 12345,
    timeCreated: new Date(workout.date),
  });

  // Workout message
  const numSteps = countWorkoutSteps(workout.steps || []);
  encoder.onMesg(Profile.MesgNum.WORKOUT, {
    sport: sportInfo.sport,
    subSport: sportInfo.subSport,
    numValidSteps: numSteps,
    wktName: (workout.name || 'Workout').substring(0, 15),
  });

  // Workout steps
  let stepIndex = 0;
  for (const step of workout.steps || []) {
    if (step.type === 'interval') {
      const repeats = step.repeat || 1;
      const onStep = step.on || { duration: 60 };
      const offStep = step.off || { duration: 60 };

      for (let i = 0; i < repeats; i++) {
        // ON step (work interval)
        const onZone = onStep.zone || 4;
        const onTarget = getZoneValues(onZone, workout.sport, userZones);

        encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, {
          messageIndex: stepIndex++,
          durationType: 'time',
          durationValue: (onStep.duration || 60) * 1000, // milliseconds
          targetType: onTarget.targetType,
          targetValue: 0,
          customTargetValueLow: onTarget.low,
          customTargetValueHigh: onTarget.high,
          intensity: 'active',
        });

        // OFF step (recovery interval)
        encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, {
          messageIndex: stepIndex++,
          durationType: 'time',
          durationValue: (offStep.duration || 60) * 1000,
          targetType: 'open',
          targetValue: 0,
          customTargetValueLow: 0,
          customTargetValueHigh: 0,
          intensity: 'recovery',
        });
      }
    } else {
      // Regular step (warmup, cooldown, active, recovery)
      const duration = step.duration || 300;
      const zone = step.zone;
      const intensity = INTENSITY_MAP[step.type] || 'active';

      if (zone) {
        const target = getZoneValues(zone, workout.sport, userZones);
        encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, {
          messageIndex: stepIndex++,
          durationType: 'time',
          durationValue: duration * 1000,
          targetType: target.targetType,
          targetValue: 0,
          customTargetValueLow: target.low,
          customTargetValueHigh: target.high,
          intensity,
        });
      } else {
        encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, {
          messageIndex: stepIndex++,
          durationType: 'time',
          durationValue: duration * 1000,
          targetType: 'open',
          targetValue: 0,
          customTargetValueLow: 0,
          customTargetValueHigh: 0,
          intensity,
        });
      }
    }
  }

  // Close encoder and return the FIT file bytes
  return encoder.close();
}

export function generateFitFilename(workout: ScheduledWorkout): string {
  const sport = workout.sport || 'workout';
  const name = (workout.name || 'workout')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 20);
  return `${workout.date}-${sport}-${name}.fit`;
}

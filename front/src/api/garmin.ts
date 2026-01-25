import type { Vitals } from '../types/Vitals';
import type { Activity } from '../types/Activity';

// Backend URL with fallback for local development
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

console.log('Using BACKEND_URL:', BACKEND_URL);

function generateSampleActivities(): Activity[] {
  const activities = [];
  const today = new Date();

  for (let i = 60; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    if (Math.random() > 0.3) {
      const duration = Math.floor(Math.random() * 90) + 30;
      const rpe = Math.floor(Math.random() * 6) + 4;
      const trainingLoad = Math.floor(Math.random() * 150) + 50;

      activities.push({
        date: date.toISOString().split('T')[0],
        duration,
        rpe,
        trainingLoad,
        tRPE: duration * rpe,
        activityType: ['Run', 'Bike', 'Swim'][Math.floor(Math.random() * 3)],
      });
    }
  }

  return activities;
}

function generateSampleVitals(): Vitals[] {
  const vitals = [];
  const today = new Date();

  for (let i = 60; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    vitals.push({
      date: date.toISOString().split('T')[0],
      sleepScore: Math.floor(Math.random() * 30) + 70,
      restingHR: Math.floor(Math.random() * 15) + 50,
      sleepingHR: Math.floor(Math.random() * 10) + 45,
      hrv: Math.floor(Math.random() * 40) + 40,
      stress: Math.floor(Math.random() * 60) + 20,
    });
  }

  return vitals;
}

type GarminSyncResult = {
  vitals: Vitals[];
  activities: Activity[];
  isRealData: boolean;
  error?: string;
};

export async function garminSync(): Promise<GarminSyncResult> {
  try {
    console.log('Fetching from:', `${BACKEND_URL}/api/sync?days=60`);

    const response = await fetch(`${BACKEND_URL}/api/sync?days=60`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Backend error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.success) {
      return {
        activities: data.activities,
        vitals: data.vitals,
        isRealData: true,
      };
    }

    throw new Error(data.error || 'Unknown error during Garmin sync');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Garmin sync error:', errorMessage);

    // Return sample data with flag indicating it's not real
    return {
      activities: generateSampleActivities(),
      vitals: generateSampleVitals(),
      isRealData: false,
      error: errorMessage,
    };
  }
}

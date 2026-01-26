import type { Vitals } from '../types/Vitals';
import type { Activity } from '../types/Activity';

type GarminSyncResult = {
  vitals: Vitals[];
  activities: Activity[];
  isRealData: boolean;
  error?: string;
};

export async function garminSync(): Promise<GarminSyncResult> {
  try {
    const response = await fetch('/api/sync?days=60', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        activities: data.activities,
        vitals: data.vitals,
        isRealData: data.isRealData ?? false,
      };
    }

    throw new Error(data.error || 'Unknown error during sync');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Garmin sync error:', errorMessage);

    return {
      activities: [],
      vitals: [],
      isRealData: false,
      error: errorMessage,
    };
  }
}

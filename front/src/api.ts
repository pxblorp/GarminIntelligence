import type { Vitals } from "./types/Vitals";
import type { Activity } from "./types/Activity";


export function save() {
}


export function load() {
}


const generateSampleActivities = () => {
    const activities = [];
    const today = new Date();
    
    for (let i = 60; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      if (Math.random() > 0.3) { // 70% chance of activity
        const duration = Math.floor(Math.random() * 90) + 30;
        const rpe = Math.floor(Math.random() * 6) + 4;
        const trainingLoad = Math.floor(Math.random() * 150) + 50;
        
        activities.push({
          date: date.toISOString().split('T')[0],
          duration,
          rpe,
          trainingLoad,
          tRPE: duration * rpe,
          activityType: ['Run', 'Bike', 'Swim'][Math.floor(Math.random() * 3)]
        });
      }
    }
    
    return activities;
  };

  const generateSampleVitals = () => {
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
        stress: Math.floor(Math.random() * 60) + 20
      });
    }
    
    return vitals;
  };

export async function fetchGarminData() : Promise<{
    activities: Activity[];
    vitals: Vitals[];
} | undefined> {
    try {
  
      const response = await fetch(`${process.env.BACKEND_URL}/api/sync?days=60`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data from Garmin');
      }
      
      const data = await response.json();
      
      if (data.success) {
        return {
          activities: data.activities,
          vitals: data.vitals
        };

      } 

        throw new Error(data.message || 'Sync failed');
      
    } catch (error) {
      console.error('Error syncing Garmin data:', error);
      alert(`Failed to sync with Garmin: ${(error as Error).message}. Using sample data instead.`);
      return {
        activities: generateSampleActivities(),
        vitals: generateSampleVitals()
      };
    }
  };
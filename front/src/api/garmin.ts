console.log("Usando BACKEND_URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
console.log("Fetch URL:", `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sync?days=60`);

import type { Vitals } from "../types/Vitals";
import type { Activity } from "../types/Activity";

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
          activityType: ['Run', 'Bike', 'Swim'][Math.floor(Math.random() * 3)]
        });
      }
    }
    
    return activities;
  };

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
        stress: Math.floor(Math.random() * 60) + 20
      });
    }
    
    return vitals;
  };


type GarminSyncResult = {
    vitals: Vitals[];
    activities: Activity[];
};

export async function garminSync() : Promise<GarminSyncResult> {
    try {
      
     // Obtiene la URL de la API desde la variable de entorno pública
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Si no está definida, lanza un error inmediato (evita usar localhost en producción)
if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL no está definida. Verifica las variables de entorno.");
}

// Realiza la petición al backend
const response = await fetch(`${BACKEND_URL}/api/sync?days=60`);

// Manejo de errores
if (!response.ok) {
  throw new Error(`Network response was not ok: ${response.statusText} ${response.status} ${response.url}`);
}

      
      const data = await response.json();
      
      if (data.success) {
        return {
            activities: data.activities,
            vitals: data.vitals
        };

      } 
      throw new Error(data.error || 'Unknown error during Garmin sync');

    } catch (error) {
    console.error('Garmin sync error:', error);
      return {
        activities: generateSampleActivities(),
        vitals: generateSampleVitals()
      };
    }
  };

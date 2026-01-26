import { NextRequest, NextResponse } from 'next/server';

type Activity = {
  date: string;
  duration: number;
  rpe: number;
  trainingLoad: number;
  tRPE: number;
  activityType: string;
};

type Vitals = {
  date: string;
  sleepScore: number;
  sleepingHR: number;
  hrv: number;
  stress: number;
};

function generateSampleActivities(days: number): Activity[] {
  const activities: Activity[] = [];
  const today = new Date();
  const activityTypes = ['Run', 'Bike', 'Swim', 'Strength', 'Yoga'];

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // ~70% chance of activity on any given day
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
        activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
      });
    }
  }

  return activities;
}

function generateSampleVitals(days: number): Vitals[] {
  const vitals: Vitals[] = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    vitals.push({
      date: date.toISOString().split('T')[0],
      sleepScore: Math.floor(Math.random() * 30) + 70,
      sleepingHR: Math.floor(Math.random() * 10) + 45,
      hrv: Math.floor(Math.random() * 40) + 40,
      stress: Math.floor(Math.random() * 60) + 20,
    });
  }

  return vitals;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '60', 10);

  // For now, return sample data
  // In the future, you could integrate with Garmin OAuth or other methods
  const activities = generateSampleActivities(days);
  const vitals = generateSampleVitals(days);

  return NextResponse.json({
    success: true,
    activities,
    vitals,
    message: `Generated ${activities.length} activities and ${vitals.length} days of vitals (sample data)`,
    isRealData: false,
  });
}

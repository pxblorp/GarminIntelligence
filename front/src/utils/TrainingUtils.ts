import type { Activity } from '../types/Activity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculate4WeekAverage(data: any[], field: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any, index: number) => {
    const startIndex = Math.max(0, index - 27);
    const subset = data.slice(startIndex, index + 1);
    const avg =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subset.reduce((sum: number, d: any) => sum + (d[field] || 0), 0) /
      subset.length;
    return {
      ...item,
      [`${field}Avg`]: Math.round(avg * 10) / 10,
    };
  });
}

export function formatActivitiesForChart(activities: Activity[]) {
  const withAverages = calculate4WeekAverage(
    calculate4WeekAverage(activities, 'tRPE'),
    'trainingLoad'
  );
  return withAverages;
}

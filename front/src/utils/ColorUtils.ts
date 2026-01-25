
export function getLoadColor(trainingLoad : number) {
    if (!trainingLoad) return 'bg-gray-100';
    if (trainingLoad < 75) return 'bg-green-200';
    if (trainingLoad < 125) return 'bg-yellow-200';
    if (trainingLoad < 175) return 'bg-orange-200';
    return 'bg-red-200';
  };


export function getSleepColor(sleepScore: number) {
    if (!sleepScore) return 'bg-gray-100';
    if (sleepScore >= 85) return 'bg-green-200';
    if (sleepScore >= 70) return 'bg-yellow-200';
    if (sleepScore >= 60) return 'bg-orange-200';
    return 'bg-red-200';
  };

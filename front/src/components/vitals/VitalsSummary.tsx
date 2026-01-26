import { Moon, Heart, TrendingUp, Activity } from 'lucide-react';

import type { Vitals } from '../../types/Vitals';

export type VitalsOverviewProps = {
  latestVitals?: Vitals;
};

const VitalsSummary = ({ latestVitals }: VitalsOverviewProps) => {
  if (!latestVitals) {
    return (
      <div className="text-center text-gray-500">No vitals data available.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <Moon size={20} />
          <span className="font-semibold">Sleep Score</span>
        </div>
        <div className="text-3xl font-bold text-blue-900">
          {latestVitals.sleepScore || '--'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <Heart size={20} />
          <span className="font-semibold">Resting HR</span>
        </div>
        <div className="text-3xl font-bold text-red-900">
          {latestVitals.restingHR || '--'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-purple-700 mb-2">
          <Moon size={20} />
          <span className="font-semibold">Sleeping HR</span>
        </div>
        <div className="text-3xl font-bold text-purple-900">
          {latestVitals.sleepingHR || '--'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-green-700 mb-2">
          <TrendingUp size={20} />
          <span className="font-semibold">HRV</span>
        </div>
        <div className="text-3xl font-bold text-green-900">
          {latestVitals.hrv || '--'}
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-orange-700 mb-2">
          <Activity size={20} />
          <span className="font-semibold">Stress</span>
        </div>
        <div className="text-3xl font-bold text-orange-900">
          {latestVitals.stress || '--'}
        </div>
      </div>
    </div>
  );
};
export default VitalsSummary;

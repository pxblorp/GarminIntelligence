'use client';

import Link from 'next/link';
import { Activity, Calendar } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Garmin Intelligence
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Load Tracking Card */}
          <Link
            href="/tracking"
            className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Load Tracking
              </h2>
              <p className="text-gray-500 text-sm">
                View your training load, vitals, and activity history
              </p>
            </div>
          </Link>

          {/* Session Planner Card */}
          <Link
            href="/planner"
            className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Session Planner
              </h2>
              <p className="text-gray-500 text-sm">
                Plan workouts and export to Garmin Connect
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

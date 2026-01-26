'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, AlertTriangle } from 'lucide-react';

import type { Vitals } from '../../types/Vitals';
import type { Activity } from '../../types/Activity';

import AppHeader from '../../components/shared/AppHeader';
import VitalsChart from '../../components/vitals/VitalsChart';
import VitalsSummary from '../../components/vitals/VitalsSummary';

import ActivitiesChart from '../../components/activities/ActivityChart';
import TrainingCalendar from '../../components/calendar/TrainingCalendar';

import DashboardDateOverview from '../../components/dashboard/DashboardDayOverview';
import { garminSync } from '../../api/garmin';

const DashboardPage = () => {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [activeChart, setActiveChart] = useState<'training' | 'vitals'>('training');

  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSampleData, setUsingSampleData] = useState<boolean>(false);

  useEffect(() => {
    setCurrentMonth(new Date());

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await garminSync();
        setVitals(result.vitals);
        setActivities(result.activities);
        setUsingSampleData(!result.isRealData);
        if (result.error) {
          console.error('Backend error:', result.error);
        }
        setError(null);
      } catch (err) {
        console.error('Error during Garmin sync:', err);
        setError('Failed to sync data from Garmin services.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const latestVitals: Vitals | undefined = useMemo(() => {
    if (vitals.length === 0) return undefined;
    return vitals[vitals.length - 1];
  }, [vitals]);

  const getActivityForDate = (date: Date): Activity | null => {
    const dateStr = date.toISOString().split('T')[0];
    return activities.find(a => a.date === dateStr) || null;
  };

  // Get vitals for the previous day (vitals like sleep/stress reflect the previous night)
  const getVitalsForDate = (date: Date): Vitals | null => {
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    const dateStr = previousDay.toISOString().split('T')[0];
    return vitals.find(v => v.date === dateStr) || null;
  };

  if (isLoading || !currentMonth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center border border-red-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        title="Load Tracking"
        subtitle="View your training load, vitals, and activity history"
        activePage="tracking"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {usingSampleData && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-yellow-800 font-medium">Showing Sample Data</p>
                <p className="text-yellow-700 text-sm">
                  Garmin Connect integration not configured.
                </p>
                <p className="text-yellow-600 text-xs mt-1">
                  Data shown is generated for demonstration purposes.
                </p>
              </div>
            </div>
          )}

          <VitalsSummary latestVitals={latestVitals} />

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveChart('training')}
              className={`px-4 py-2 rounded-lg transition ${
                activeChart === 'training'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Training Metrics
            </button>
            <button
              onClick={() => setActiveChart('vitals')}
              className={`px-4 py-2 rounded-lg transition ${
                activeChart === 'vitals'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Health Vitals
            </button>
          </div>

          <div className="mb-6">
            {activeChart === 'training' ? (
              <ActivitiesChart activities={activities} />
            ) : (
              <VitalsChart vitals={vitals} />
            )}
          </div>

          <div className="mb-6">
            <TrainingCalendar
              currentMonth={currentMonth}
              activities={activities}
              vitals={vitals}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onMonthChange={(date: Date) => setCurrentMonth(date)}
            />
          </div>

          {/* Day Detail - Inline Display */}
          <div className="mb-6">
            {selectedDate ? (
              <DashboardDateOverview
                selectedDate={selectedDate}
                activityForDate={getActivityForDate(selectedDate)}
                vitalsForDate={getVitalsForDate(selectedDate)}
              />
            ) : (
              <div className="text-center text-gray-500 py-4">
                Select a date on the calendar to view details.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;

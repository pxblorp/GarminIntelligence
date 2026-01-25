'use client';

import Link from 'next/link';
import { Activity, Calendar } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Activity as ActivityIcon, Loader2, AlertCircle, Calendar, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import type { Vitals } from '../types/Vitals';
import type { Activity } from '../types/Activity';


import VitalsChart from '../components/vitals/VitalsChart';
import VitalsSummary from '../components/vitals/VitalsSummary';

import ActivitiesChart from '../components/activities/ActivityChart';
import TrainingCalendar from '../components/calendar/TrainingCalendar';

import DashboardDateOverview from '../components/dashboard/DashboardDayOverview';
import { garminSync } from '../api/garmin';

const DashboardPage = () => {

  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [activeChart, setActiveChart] = useState<'training' | 'vitals'>('training');

  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSampleData, setUsingSampleData] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);


  useEffect(() => {
    // Fix hydration mismatch by setting date on client load
    setCurrentMonth(new Date());

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await garminSync();
        setVitals(result.vitals);
        setActivities(result.activities);
        setUsingSampleData(!result.isRealData);
        setBackendError(result.error || null);
        setError(null);
      } catch (error) {
        console.error('Error during Garmin sync:', error);
        setError('Failed to sync data from Garmin services.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


  const latestVitals : Vitals | undefined = useMemo(() => {
    if (vitals.length === 0) return undefined;
    return vitals[vitals.length - 1];
  }, [vitals]);



  const getActivityForDate = (date: Date) : Activity | null => {
    const dateStr = date.toISOString().split('T')[0];
    return activities.find(a => a.date === dateStr) || null;
  };

  const getVitalsForDate = (date: Date) : Vitals | null => {
    const dateStr = date.toISOString().split('T')[0];
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <ActivityIcon className="text-blue-600" />
              Training Load Dashboard
            </h1>
            <Link
              href="/planner"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
            >
              <Calendar size={18} />
              Training Planner
              <ArrowRight size={16} />
            </Link>
          </div>

          {usingSampleData && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-yellow-800 font-medium">Showing Sample Data</p>
                <p className="text-yellow-700 text-sm">
                  Could not connect to backend. {backendError && `Error: ${backendError}`}
                </p>
                <p className="text-yellow-600 text-xs mt-1">
                  Make sure the backend is running and NEXT_PUBLIC_BACKEND_URL is configured correctly.
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onMonthChange={(date: Date) => setCurrentMonth(date)}
            />
          </div>

          <div className="mb-6">
            {selectedDate ? (
              <DashboardDateOverview
                selectedDate={selectedDate}
                activityForDate={getActivityForDate(selectedDate)}
                vitalsForDate={getVitalsForDate(selectedDate)}
              />
            ) : (
              <div className="text-center text-gray-500">Select a date on the calendar to view details.</div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

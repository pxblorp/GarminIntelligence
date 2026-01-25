import { useState, useEffect, useMemo } from 'react';

import { Activity as ActivityIcon } from 'lucide-react';

import type { Vitals } from '../types/Vitals';
import type { Activity } from '../types/Activity';


import VitalsChart from '../components/vitals/VitalsChart';
import VitalsSummary from '../components/vitals/VitalsSummary';

import ActivitiesChart from '../components/activities/ActivityChart';
import TrainingCalendar from '../components/calendar/TrainingCalendar';

import DashboardDateOverview from '../components/dashboard/DashboardDayOverview';

const DashboardPage = () => {

  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [activeChart, setActiveChart] = useState<'training' | 'vitals'>('training'); // 'training' or 'vitals'

  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();

  


  useEffect(() => {
    const fetchData = async () => {
      setVitals([]);
      setActivities([]);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <ActivityIcon className="text-blue-600" />
              Training Load Dashboard
            </h1>
          </div>

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
              onMonthChange={setCurrentMonth}
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
};

export default DashboardPage;

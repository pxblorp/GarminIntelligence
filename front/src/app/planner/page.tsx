'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import WeeklyCalendar from '../../components/planner/WeeklyCalendar';
import WorkoutLibrary from '../../components/planner/WorkoutLibrary';
import WorkoutBuilder from '../../components/planner/WorkoutBuilder';
import type { Workout, ScheduledWorkout, WeekCalendar } from '../../types/Workout';
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getCalendar,
  scheduleWorkout,
  unscheduleWorkout,
  exportWeek,
  downloadBlob,
} from '../../api/workouts';

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function PlannerPage() {
  // State
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [calendar, setCalendar] = useState<WeekCalendar>({});
  const [weeklyLoad, setWeeklyLoad] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>();
  const [addingToDate, setAddingToDate] = useState<string | null>(null);

  // Initialize week start on client side
  useEffect(() => {
    setWeekStart(getMonday(new Date()));
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    if (!weekStart) return;

    setIsLoading(true);
    setError(null);

    try {
      const endDate = addDays(weekStart, 6);

      const [workoutsData, calendarData] = await Promise.all([
        getWorkouts(),
        getCalendar(formatDate(weekStart), formatDate(endDate)),
      ]);

      setWorkouts(workoutsData);
      setCalendar(calendarData.calendar);
      setWeeklyLoad(calendarData.weeklyLoad);
    } catch (err) {
      console.error('Failed to load planner data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleWeekChange = (newWeekStart: Date) => {
    setWeekStart(newWeekStart);
  };

  const handleCreateWorkout = () => {
    setEditingWorkout(undefined);
    setShowBuilder(true);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setShowBuilder(true);
  };

  const handleSaveWorkout = async (workoutData: Omit<Workout, 'id'>) => {
    try {
      if (editingWorkout) {
        await updateWorkout(editingWorkout.id, workoutData);
      } else {
        const newWorkout = await createWorkout(workoutData);

        // If we're adding to a specific date, schedule it
        if (addingToDate) {
          await scheduleWorkout(addingToDate, newWorkout.id);
          setAddingToDate(null);
        }
      }

      setShowBuilder(false);
      setEditingWorkout(undefined);
      loadData();
    } catch (err) {
      console.error('Failed to save workout:', err);
      alert(err instanceof Error ? err.message : 'Failed to save workout');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      await deleteWorkout(workoutId);
      loadData();
    } catch (err) {
      console.error('Failed to delete workout:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete workout');
    }
  };

  const handleDuplicateWorkout = async (workout: Workout) => {
    try {
      await createWorkout({
        ...workout,
        name: `${workout.name} (Copy)`,
      });
      loadData();
    } catch (err) {
      console.error('Failed to duplicate workout:', err);
      alert(err instanceof Error ? err.message : 'Failed to duplicate workout');
    }
  };

  const handleAddWorkoutToDate = (date: string) => {
    setAddingToDate(date);
    // Show workout picker or create new
    // For now, let's show the builder
    setEditingWorkout(undefined);
    setShowBuilder(true);
  };

  const handleDropWorkout = async (date: string, workout: Workout) => {
    try {
      await scheduleWorkout(date, workout);
      loadData();
    } catch (err) {
      console.error('Failed to schedule workout:', err);
      alert(err instanceof Error ? err.message : 'Failed to schedule workout');
    }
  };

  const handleRemoveScheduled = async (date: string, scheduledId: string) => {
    try {
      await unscheduleWorkout(date, scheduledId);
      loadData();
    } catch (err) {
      console.error('Failed to remove workout:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove workout');
    }
  };

  const handleExportWeek = async () => {
    if (!weekStart) return;

    try {
      const blob = await exportWeek(formatDate(weekStart));
      const endDate = addDays(weekStart, 6);
      const filename = `workouts-${formatDate(weekStart)}-to-${formatDate(endDate)}.zip`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Failed to export week:', err);
      alert(err instanceof Error ? err.message : 'Failed to export week');
    }
  };

  // Prevent hydration mismatch
  if (!weekStart) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Training Planner</h1>
                <p className="text-sm text-gray-500">
                  Plan your week, then export to Garmin Connect
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <div>
              <p className="text-red-700 font-medium">Error loading data</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={loadData}
              className="ml-auto px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Workout Library (Sidebar) */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="sticky top-6">
                <WorkoutLibrary
                  workouts={workouts}
                  onCreateNew={handleCreateWorkout}
                  onEdit={handleEditWorkout}
                  onDelete={handleDeleteWorkout}
                  onDuplicate={handleDuplicateWorkout}
                />
              </div>
            </div>

            {/* Weekly Calendar (Main) */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <WeeklyCalendar
                weekStart={weekStart}
                calendar={calendar}
                weeklyLoad={weeklyLoad}
                targetLoad={500}
                onWeekChange={handleWeekChange}
                onAddWorkout={handleAddWorkoutToDate}
                onRemoveWorkout={handleRemoveScheduled}
                onDropWorkout={handleDropWorkout}
                onExportWeek={handleExportWeek}
              />

              {/* Instructions */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">How to use</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Create workouts in the library (left panel)</li>
                  <li>Drag workouts onto calendar days to schedule them</li>
                  <li>Adjust your weekly load to match your training goals</li>
                  <li>Click &quot;Export Week&quot; to download FIT files</li>
                  <li>Upload the ZIP to Garmin Connect to sync to your watch</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Workout Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-h-[90vh] overflow-y-auto">
            <WorkoutBuilder
              workout={editingWorkout}
              onSave={handleSaveWorkout}
              onCancel={() => {
                setShowBuilder(false);
                setEditingWorkout(undefined);
                setAddingToDate(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

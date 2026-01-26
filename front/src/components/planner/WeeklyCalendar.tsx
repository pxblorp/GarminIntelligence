'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Download, Plus } from 'lucide-react';
import type { ScheduledWorkout, WeekCalendar, Workout } from '../../types/Workout';
import { SPORT_OPTIONS } from '../../types/Workout';

export type WeeklyCalendarProps = {
  weekStart: Date;
  calendar: WeekCalendar;
  weeklyLoad: number;
  targetLoad?: number;
  onWeekChange: (newWeekStart: Date) => void;
  onAddWorkout: (date: string) => void;
  onRemoveWorkout: (date: string, scheduledId: string) => void;
  onDropWorkout: (date: string, workout: Workout) => void;
  onMoveWorkout: (sourceDate: string, scheduledId: string, targetDate: string) => void;
  onExportWeek: () => void;
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

function calculateWorkoutDuration(workout: ScheduledWorkout): number {
  return workout.steps.reduce((total, step) => {
    if (step.type === 'interval') {
      const repeats = step.repeat || 1;
      const onDur = step.on?.duration || 0;
      const offDur = step.off?.duration || 0;
      return total + repeats * (onDur + offDur);
    }
    return total + (step.duration || 0);
  }, 0);
}

const WeeklyCalendar = ({
  weekStart,
  calendar,
  weeklyLoad,
  targetLoad = 500,
  onWeekChange,
  onAddWorkout,
  onRemoveWorkout,
  onDropWorkout,
  onMoveWorkout,
  onExportWeek,
}: WeeklyCalendarProps) => {
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    onWeekChange(newDate);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = start of week
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    onWeekChange(monday);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');

    const workoutJson = e.dataTransfer.getData('application/json');
    if (workoutJson) {
      try {
        const data = JSON.parse(workoutJson);

        // Check if this is a move (scheduled workout with sourceDate)
        if (data.sourceDate && data.scheduledId) {
          // Don't move to the same date
          if (data.sourceDate !== targetDate) {
            onMoveWorkout(data.sourceDate, data.scheduledId, targetDate);
          }
        } else {
          // This is a copy from the library
          onDropWorkout(targetDate, data as Workout);
        }
      } catch (err) {
        console.error('Failed to parse dropped workout:', err);
      }
    }
  };

  const loadPercentage = Math.min(100, (weeklyLoad / targetLoad) * 100);
  const loadColor =
    loadPercentage < 75
      ? 'bg-green-500'
      : loadPercentage < 100
        ? 'bg-yellow-500'
        : loadPercentage < 125
          ? 'bg-orange-500'
          : 'bg-red-500';

  const weekEndDate = weekDates[6];
  const weekRangeLabel = `${formatShortDate(weekStart)} - ${formatShortDate(weekEndDate)}`;

  const hasWorkouts = Object.values(calendar).some((workouts) => workouts.length > 0);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold min-w-[180px] text-center">{weekRangeLabel}</h2>
            <button
              onClick={() => navigateWeek(1)}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={onExportWeek}
              disabled={!hasWorkouts}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export Week
            </button>
          </div>
        </div>

        {/* Weekly Load Progress */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/80">Week Load:</span>
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full ${loadColor} transition-all duration-300`}
              style={{ width: `${Math.min(100, loadPercentage)}%` }}
            />
          </div>
          <span className="text-sm font-medium min-w-[80px] text-right">
            {Math.round(weeklyLoad)} / {targetLoad}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-gray-200">
        {/* Day Headers */}
        {DAYS.map((day, index) => {
          const date = weekDates[index];
          const isToday = formatDate(date) === formatDate(new Date());

          return (
            <div
              key={day}
              className={`p-2 text-center border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                {day}
              </div>
              <div
                className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}

        {/* Day Cells */}
        {weekDates.map((date, index) => {
          const dateStr = formatDate(date);
          const workouts = calendar[dateStr] || [];
          const dayLoad = workouts.reduce((sum, w) => sum + (w.estimatedLoad || 0), 0);
          const isToday = dateStr === formatDate(new Date());

          return (
            <div
              key={dateStr}
              className={`min-h-[200px] p-2 ${isToday ? 'bg-blue-50/50' : ''} transition-colors`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dateStr)}
            >
              {/* Workouts */}
              <div className="space-y-2 mb-2">
                {workouts.map((workout) => (
                  <WorkoutCard
                    key={workout.scheduledId}
                    workout={workout}
                    sourceDate={dateStr}
                    onRemove={() => onRemoveWorkout(dateStr, workout.scheduledId)}
                  />
                ))}
              </div>

              {/* Add Button */}
              <button
                onClick={() => onAddWorkout(dateStr)}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 text-sm"
              >
                <Plus size={16} />
                Add
              </button>

              {/* Day Load */}
              {dayLoad > 0 && (
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Load: {Math.round(dayLoad)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Workout Card Sub-component
type WorkoutCardProps = {
  workout: ScheduledWorkout;
  sourceDate: string;
  onRemove: () => void;
};

const WorkoutCard = ({ workout, sourceDate, onRemove }: WorkoutCardProps) => {
  const sportOption = SPORT_OPTIONS.find((s) => s.value === workout.sport);
  const duration = calculateWorkoutDuration(workout);

  const handleDragStart = (e: React.DragEvent) => {
    // Include source info for move operation
    const dragData = {
      ...workout,
      sourceDate,
      scheduledId: workout.scheduledId,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`group relative rounded-lg p-2 cursor-move hover:shadow-md transition-shadow ${sportOption?.color || 'bg-gray-500'} bg-opacity-20 border-l-4 ${sportOption?.color.replace('bg-', 'border-') || 'border-gray-500'}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">{workout.name}</div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${sportOption?.color}`}>
              {sportOption?.label || workout.sport}
            </span>
            <span>{formatDuration(duration)}</span>
            {workout.rpe && <span>RPE {workout.rpe}</span>}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {workout.notes && (
        <div className="mt-1 text-xs text-gray-500 truncate">{workout.notes}</div>
      )}
    </div>
  );
};

export default WeeklyCalendar;

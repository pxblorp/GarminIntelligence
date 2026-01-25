'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, GripVertical } from 'lucide-react';
import type { Workout } from '../../types/Workout';
import { SPORT_OPTIONS } from '../../types/Workout';

export type WorkoutLibraryProps = {
  workouts: Workout[];
  onCreateNew: () => void;
  onEdit: (workout: Workout) => void;
  onDelete: (workoutId: string) => void;
  onDuplicate: (workout: Workout) => void;
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

function calculateWorkoutDuration(workout: Workout): number {
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

const WorkoutLibrary = ({
  workouts,
  onCreateNew,
  onEdit,
  onDelete,
  onDuplicate,
}: WorkoutLibraryProps) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesSport = filter === 'all' || workout.sport === filter;
    const matchesSearch =
      searchQuery === '' ||
      workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workout.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

  const groupedWorkouts = SPORT_OPTIONS.reduce(
    (acc, sport) => {
      acc[sport.value] = filteredWorkouts.filter((w) => w.sport === sport.value);
      return acc;
    },
    {} as Record<string, Workout[]>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Workout Library</h2>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 rounded-md transition-colors"
          >
            <Plus size={16} />
            New Workout
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search workouts..."
          className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
        />
      </div>

      {/* Sport Filter */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        {SPORT_OPTIONS.map((sport) => (
          <button
            key={sport.value}
            onClick={() => setFilter(sport.value)}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              filter === sport.value
                ? `${sport.color} text-white`
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {sport.label}
          </button>
        ))}
      </div>

      {/* Workout List */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredWorkouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No workouts found</p>
            <button
              onClick={onCreateNew}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Create your first workout
            </button>
          </div>
        ) : filter === 'all' ? (
          // Show grouped by sport
          <div className="space-y-4">
            {SPORT_OPTIONS.map((sport) => {
              const sportWorkouts = groupedWorkouts[sport.value];
              if (sportWorkouts.length === 0) return null;

              return (
                <div key={sport.value}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sport.color}`} />
                    {sport.label} ({sportWorkouts.length})
                  </h3>
                  <div className="space-y-2">
                    {sportWorkouts.map((workout) => (
                      <WorkoutLibraryCard
                        key={workout.id}
                        workout={workout}
                        onEdit={() => onEdit(workout)}
                        onDelete={() => onDelete(workout.id)}
                        onDuplicate={() => onDuplicate(workout)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Show flat list for single sport
          <div className="space-y-2">
            {filteredWorkouts.map((workout) => (
              <WorkoutLibraryCard
                key={workout.id}
                workout={workout}
                onEdit={() => onEdit(workout)}
                onDelete={() => onDelete(workout.id)}
                onDuplicate={() => onDuplicate(workout)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 text-center">
        Drag workouts onto the calendar to schedule them
      </div>
    </div>
  );
};

// Workout Card Sub-component
type WorkoutLibraryCardProps = {
  workout: Workout;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

const WorkoutLibraryCard = ({ workout, onEdit, onDelete, onDuplicate }: WorkoutLibraryCardProps) => {
  const sportOption = SPORT_OPTIONS.find((s) => s.value === workout.sport);
  const duration = calculateWorkoutDuration(workout);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(workout));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div className="text-gray-300 group-hover:text-gray-400 mt-0.5">
          <GripVertical size={16} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-1.5 py-0.5 rounded text-white text-[10px] font-medium ${sportOption?.color}`}
            >
              {sportOption?.label}
            </span>
            <span className="text-sm font-medium text-gray-800 truncate">{workout.name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatDuration(duration)}</span>
            <span>RPE {workout.rpe}</span>
            {workout.estimatedLoad && <span>Load ~{Math.round(workout.estimatedLoad)}</span>}
          </div>

          {workout.notes && (
            <div className="mt-1 text-xs text-gray-400 truncate">{workout.notes}</div>
          )}

          {/* Steps Summary */}
          <div className="mt-2 flex flex-wrap gap-1">
            {workout.steps.map((step, index) => {
              const getStepBadge = () => {
                switch (step.type) {
                  case 'warmup':
                    return 'bg-yellow-100 text-yellow-700';
                  case 'cooldown':
                    return 'bg-blue-100 text-blue-700';
                  case 'interval':
                    return 'bg-red-100 text-red-700';
                  case 'recovery':
                    return 'bg-green-100 text-green-700';
                  default:
                    return 'bg-gray-100 text-gray-700';
                }
              };

              const label =
                step.type === 'interval'
                  ? `${step.repeat}x`
                  : `${Math.floor((step.duration || 0) / 60)}m`;

              return (
                <span
                  key={index}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStepBadge()}`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this workout?')) {
                onDelete();
              }
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutLibrary;

'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Save, X } from 'lucide-react';
import type { Workout, WorkoutStep } from '../../types/Workout';
import {
  SPORT_OPTIONS,
  STEP_TYPE_OPTIONS,
  HR_ZONES,
} from '../../types/Workout';

export type WorkoutBuilderProps = {
  workout?: Workout;
  onSave: (workout: Omit<Workout, 'id'>) => void;
  onCancel: () => void;
};

const defaultStep: WorkoutStep = {
  type: 'active',
  duration: 600,
  zone: 2,
};

const defaultIntervalStep: WorkoutStep = {
  type: 'interval',
  repeat: 5,
  on: { duration: 180, zone: 4 },
  off: { duration: 180, zone: 2 },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0
    ? `${mins}:${secs.toString().padStart(2, '0')}`
    : `${mins} min`;
}

function parseDuration(value: string): number {
  // Handle "mm:ss" or just minutes
  if (value.includes(':')) {
    const [mins, secs] = value.split(':').map(Number);
    return (mins || 0) * 60 + (secs || 0);
  }
  return (parseInt(value, 10) || 0) * 60;
}

const WorkoutBuilder = ({ workout, onSave, onCancel }: WorkoutBuilderProps) => {
  const [name, setName] = useState(workout?.name || '');
  const [sport, setSport] = useState<Workout['sport']>(workout?.sport || 'run');
  const [rpe, setRpe] = useState(workout?.rpe || 5);
  const [notes, setNotes] = useState(workout?.notes || '');
  const [steps, setSteps] = useState<WorkoutStep[]>(
    workout?.steps || [
      { type: 'warmup', duration: 600, zone: 2 },
      { type: 'active', duration: 1200, zone: 3 },
      { type: 'cooldown', duration: 300, zone: 1 },
    ]
  );

  const addStep = (type: WorkoutStep['type']) => {
    if (type === 'interval') {
      setSteps([...steps, { ...defaultIntervalStep }]);
    } else {
      setSteps([...steps, { ...defaultStep, type }]);
    }
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, updates: Partial<WorkoutStep>) => {
    setSteps(
      steps.map((step, i) => (i === index ? { ...step, ...updates } : step))
    );
  };

  const moveStep = (from: number, to: number) => {
    const newSteps = [...steps];
    const [moved] = newSteps.splice(from, 1);
    newSteps.splice(to, 0, moved);
    setSteps(newSteps);
  };

  const calculateTotalDuration = (): number => {
    return steps.reduce((total, step) => {
      if (step.type === 'interval') {
        const repeats = step.repeat || 1;
        const onDur = step.on?.duration || 0;
        const offDur = step.off?.duration || 0;
        return total + repeats * (onDur + offDur);
      }
      return total + (step.duration || 0);
    }, 0);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a workout name');
      return;
    }
    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    onSave({
      sport,
      name: name.trim(),
      steps,
      rpe,
      notes: notes.trim(),
    });
  };

  const sportOption = SPORT_OPTIONS.find((s) => s.value === sport);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {workout ? 'Edit Workout' : 'Create Workout'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* Basic Info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workout Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., VO2 Intervals"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sport
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value as Workout['sport'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {SPORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RPE (1-10)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value, 10))}
                className="flex-1"
              />
              <span className="w-8 text-center font-semibold text-gray-800">
                {rpe}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Focus on trim, maintain cadence 90"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Workout Steps
          </label>
          <span className="text-sm text-gray-500">
            Total: {formatDuration(calculateTotalDuration())}
          </span>
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <StepEditor
              key={index}
              step={step}
              index={index}
              total={steps.length}
              onUpdate={(updates) => updateStep(index, updates)}
              onRemove={() => removeStep(index)}
              onMoveUp={() => index > 0 && moveStep(index, index - 1)}
              onMoveDown={() =>
                index < steps.length - 1 && moveStep(index, index + 1)
              }
            />
          ))}
        </div>

        {/* Add Step Buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {STEP_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => addStep(option.value)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              <Plus size={14} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Sport:</span>
            <span
              className={`ml-2 px-2 py-0.5 rounded text-white text-xs ${sportOption?.color}`}
            >
              {sportOption?.label}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>
            <span className="ml-2 font-medium">
              {formatDuration(calculateTotalDuration())}
            </span>
          </div>
          <div>
            <span className="text-gray-500">RPE:</span>
            <span className="ml-2 font-medium">{rpe}/10</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <Save size={16} />
          Save Workout
        </button>
      </div>
    </div>
  );
};

// Step Editor Sub-component
type StepEditorProps = {
  step: WorkoutStep;
  index: number;
  total: number;
  onUpdate: (updates: Partial<WorkoutStep>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

const StepEditor = ({
  step,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: StepEditorProps) => {
  const stepTypeOption = STEP_TYPE_OPTIONS.find((s) => s.value === step.type);
  const zoneInfo = HR_ZONES.find((z) => z.zone === step.zone);

  const getStepColor = () => {
    switch (step.type) {
      case 'warmup':
        return 'border-l-yellow-400 bg-yellow-50';
      case 'cooldown':
        return 'border-l-blue-400 bg-blue-50';
      case 'interval':
        return 'border-l-red-400 bg-red-50';
      case 'recovery':
        return 'border-l-green-400 bg-green-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  return (
    <div className={`border-l-4 rounded-r-lg p-3 ${getStepColor()}`}>
      <div className="flex items-start gap-2">
        {/* Drag Handle & Order */}
        <div className="flex flex-col items-center gap-1 text-gray-400">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="hover:text-gray-600 disabled:opacity-30"
          >
            <GripVertical size={16} />
          </button>
          <span className="text-xs font-medium">{index + 1}</span>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="hover:text-gray-600 disabled:opacity-30"
          >
            <GripVertical size={16} />
          </button>
        </div>

        {/* Step Content */}
        <div className="flex-1 space-y-2">
          {/* Step Type & Remove */}
          <div className="flex justify-between items-center">
            <select
              value={step.type}
              onChange={(e) => {
                const newType = e.target.value as WorkoutStep['type'];
                if (newType === 'interval') {
                  onUpdate({
                    type: newType,
                    repeat: 5,
                    on: { duration: 180, zone: 4 },
                    off: { duration: 180, zone: 2 },
                    duration: undefined,
                    zone: undefined,
                  });
                } else {
                  onUpdate({
                    type: newType,
                    duration: step.duration || 600,
                    zone: step.zone || 2,
                    repeat: undefined,
                    on: undefined,
                    off: undefined,
                  });
                }
              }}
              className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              {STEP_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={onRemove}
              className="p-1 text-red-400 hover:text-red-600 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Step Details */}
          {step.type === 'interval' ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-gray-500">Repeats</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={step.repeat || 5}
                  onChange={(e) =>
                    onUpdate({ repeat: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-2">
                <div className="bg-white rounded p-2 border">
                  <div className="text-xs font-medium text-red-600 mb-1">
                    ON
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={Math.floor((step.on?.duration || 0) / 60)}
                      onChange={(e) =>
                        onUpdate({
                          on: {
                            zone: step.on?.zone || 4,
                            ...step.on,
                            duration: parseDuration(e.target.value),
                          },
                        })
                      }
                      placeholder="min"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <select
                      value={step.on?.zone || 4}
                      onChange={(e) =>
                        onUpdate({
                          on: {
                            duration: step.on?.duration || 180,
                            ...step.on,
                            zone: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {HR_ZONES.map((z) => (
                        <option key={z.zone} value={z.zone}>
                          Z{z.zone}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="text-xs font-medium text-green-600 mb-1">
                    OFF
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={Math.floor((step.off?.duration || 0) / 60)}
                      onChange={(e) =>
                        onUpdate({
                          off: {
                            zone: step.off?.zone || 2,
                            ...step.off,
                            duration: parseDuration(e.target.value),
                          },
                        })
                      }
                      placeholder="min"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <select
                      value={step.off?.zone || 2}
                      onChange={(e) =>
                        onUpdate({
                          off: {
                            duration: step.off?.duration || 180,
                            ...step.off,
                            zone: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {HR_ZONES.map((z) => (
                        <option key={z.zone} value={z.zone}>
                          Z{z.zone}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 text-sm">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Duration (min)</label>
                <input
                  type="number"
                  min="1"
                  value={Math.floor((step.duration || 0) / 60)}
                  onChange={(e) =>
                    onUpdate({
                      duration: (parseInt(e.target.value, 10) || 1) * 60,
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">HR Zone</label>
                <select
                  value={step.zone || 2}
                  onChange={(e) =>
                    onUpdate({ zone: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {HR_ZONES.map((z) => (
                    <option key={z.zone} value={z.zone}>
                      Z{z.zone} - {z.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutBuilder;

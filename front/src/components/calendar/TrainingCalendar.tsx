import { Calendar } from 'lucide-react';

import TrainingCalendarDay from './TrainingCalendarDay';

import { getMonthStructure } from '../../utils/DateUtils';

import type { Vitals } from '../../types/Vitals';
import type { Activity } from '../../types/Activity';

export type TrainingCalendarProps = {
  currentMonth: Date;
  activities: Activity[];
  vitals: Vitals[];
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
  onMonthChange: (date: Date) => void;
};

const TrainingCalendar = ({
  currentMonth,
  activities,
  vitals,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: TrainingCalendarProps) => {
  const getActivityForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return activities.find((a) => a.date === dateStr);
  };

  const getVitalsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return vitals.find((v) => v.date === dateStr);
  };

  const { daysInMonth, startingWeekday } = getMonthStructure(currentMonth);
  const days = [];

  for (let i = 0; i < startingWeekday; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const vitalForDay = getVitalsForDate(date);
    const activityForDay = getActivityForDate(date);
    const isSelected =
      selectedDate && date.toDateString() === selectedDate.toDateString();

    days.push(
      <TrainingCalendarDay
        key={day}
        date={date}
        selected={isSelected}
        vitals={vitalForDay}
        activity={activityForDay}
        onClickCalendarDay={onSelectDate}
      />
    );
  }

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={24} />
          Activity & Vitals Calendar
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() =>
              onMonthChange(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1
                )
              )
            }
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            ←
          </button>
          <span className="px-4 py-1 font-semibold">
            {currentMonth.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <button
            onClick={() =>
              onMonthChange(
                new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1
                )
              )
            }
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-sm text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{days}</div>

      <div className="mt-4">
        <div className="font-semibold mb-2 text-sm">
          Background Color - Sleep Score:
        </div>
        <div className="flex gap-4 text-sm mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 border"></div>
            <span>Excellent (≥85)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 border"></div>
            <span>Good (70-84)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-200 border"></div>
            <span>Fair (60-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 border"></div>
            <span>Poor (&lt;60)</span>
          </div>
        </div>
        <div className="font-semibold mb-2 text-sm">
          Activity Badge - Training Load:
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 border"></div>
            <span>Light (&lt;75)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 border"></div>
            <span>Moderate (75-125)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-200 border"></div>
            <span>Heavy (125-175)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 border"></div>
            <span>Very Heavy (&gt;175)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingCalendar;

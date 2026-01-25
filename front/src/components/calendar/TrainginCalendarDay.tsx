

import { Heart, Moon} from 'lucide-react'

import { getLoadColor, getSleepColor } from '../../utils/ColorUtils';

import type { Vitals } from '../../types/Vitals'
import type { Activity } from '../../types/Activity';

export type TrainingCalendarDayProps = {
    date: Date;
    vitals?: Vitals;
    activity?: Activity;
    selected?: boolean;
    onClickCalendarDay: (date: Date) => void;

};

const TrainingCalendarDay = (
    {
        date,
        selected = false,
        vitals,
        activity,
        onClickCalendarDay
    } : TrainingCalendarDayProps
) => {

    const day = date.getDate();

    return <div
          key={day}
          className={`aspect-square p-1 border cursor-pointer ${vitals ? getSleepColor(vitals.sleepScore) : ''} ${selected ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => onClickCalendarDay(date)}
        >
          <div className="text-xs font-semibold">{day}</div>
          {activity && (
            <div className={`text-xs mt-0.5 p-0.5 rounded ${getLoadColor(activity.trainingLoad)}`}>
              <div className="font-semibold">{activity.activityType}</div>
              <div>TL: {activity.trainingLoad}</div>
            </div>
          )}
          <div className="text-xs mt-0.5">
            <div className="flex items-center gap-0.5">
              <Moon size={10} />
              <span>{vitals ? vitals.sleepScore : '-'}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Heart size={10} />
              <span>{vitals ? vitals.restingHR : '-'}</span>
            </div>
          </div>
        </div>
}

export default TrainingCalendarDay;
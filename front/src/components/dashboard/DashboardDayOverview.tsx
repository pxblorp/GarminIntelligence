


import type { Vitals } from "../../types/Vitals";
import type { Activity } from "../../types/Activity";

export type DashboardDateOverviewProps = {
    selectedDate: Date;
    activityForDate: Activity | null;
    vitalsForDate: Vitals | null;
}

const DashboardDayOverview = ({ selectedDate, activityForDate, vitalsForDate }: DashboardDateOverviewProps) => {

    const hasVitals = vitalsForDate !== null;
    const hasActivity = activityForDate !== null;
    
    const hasNone = !hasVitals && !hasActivity;


    const renderContent = () => {
        if (hasNone) {
            return <p className="text-gray-600">No data recorded for this day.</p>;
        }

        return <>
            
            {hasActivity ? (
                <div className="mb-4">
                    <h4 className="font-semibold text-md mb-2">Activity</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <div className="text-sm text-gray-600">Type</div>
                            <div className="font-semibold">{activityForDate.activityType}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Duration</div>
                            <div className="font-semibold">{activityForDate.duration} min</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">RPE</div>
                            <div className="font-semibold">{activityForDate.rpe}/10</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">t*RPE</div>
                            <div className="font-semibold">{activityForDate.tRPE}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Training Load</div>
                            <div className="font-semibold">{activityForDate.trainingLoad}</div>
                        </div>
                    </div>
                </div>
            ) : <div className="mb-4 text-gray-600">No activity recorded for this day.</div>}
            
            {hasVitals ? (
                <div>
                    <h4 className="font-semibold text-md mb-2">Health Vitals</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <div className="text-sm text-gray-600">Sleep Score</div>
                            <div className="font-semibold">{vitalsForDate.sleepScore}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Resting HR</div>
                            <div className="font-semibold">{vitalsForDate.restingHR} bpm</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Sleeping HR</div>
                            <div className="font-semibold">{vitalsForDate.sleepingHR} bpm</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">HRV</div>
                            <div className="font-semibold">{vitalsForDate.hrv} ms</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Stress</div>
                            <div className="font-semibold">{vitalsForDate.stress}</div>
                        </div>
                    </div>
                </div>
            ) : <div className="mb-4 text-gray-600">No health vitals recorded for this day.</div>}
            </>;
        }
    
    return (
        <div className="bg-blue-50 p-4 rounded-lg">

            <h3 className="font-bold text-lg mb-3">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>

            {renderContent()}
            
        </div>
    );
};

export default DashboardDayOverview;
'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import type { Vitals } from "../../types/Vitals";
import type { Activity } from "../../types/Activity";

export type DashboardDateOverviewProps = {
    selectedDate: Date;
    activityForDate: Activity | null;
    vitalsForDate: Vitals | null;
    onClose: () => void;
}

const DashboardDayOverview = ({ selectedDate, activityForDate, vitalsForDate, onClose }: DashboardDateOverviewProps) => {

    const hasVitals = vitalsForDate !== null;
    const hasActivity = activityForDate !== null;

    const hasNone = !hasVitals && !hasActivity;

    // Close on escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Close when clicking the backdrop
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm text-gray-600">Sleep Score</div>
                            <div className="font-semibold">{vitalsForDate.sleepScore}</div>
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
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <h3 className="font-bold text-xl mb-4 text-gray-800 pr-8">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>

                {renderContent()}
            </div>
        </div>
    );
};

export default DashboardDayOverview;

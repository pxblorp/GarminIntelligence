
import type { Activity } from "../../types/Activity";

import { ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from "recharts";

import { formatActivitiesForChart } from "../../utils/TrainingUtils";

export type ActivitiesChartProps = {
  activities: Activity[];
};

const ActivitiesChart = ({ activities }: ActivitiesChartProps) => {
    if (!activities || activities.length === 0) {
        return <div className="text-center text-gray-500 py-8">No training data available</div>;
    }
    
    const chartData = formatActivitiesForChart(activities);
    return <>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Training Load & t*RPE</h2>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="trainingLoad" stroke="#3b82f6" name="Training Load" strokeWidth={2} />
                    <Line type="monotone" dataKey="trainingLoadAvg" stroke="#93c5fd" name="4-Week Avg TL" strokeWidth={2} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="tRPE" stroke="#ef4444" name="t*RPE" strokeWidth={2} />
                    <Line type="monotone" dataKey="tRPEAvg" stroke="#fca5a5" name="4-Week Avg t*RPE" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
            </ResponsiveContainer>
        </>;
}

export default ActivitiesChart;
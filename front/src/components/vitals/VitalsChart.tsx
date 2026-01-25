
import type { Vitals } from "../../types/Vitals";

import { ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from "recharts";

export type VitalsChartProps = {
  vitals: Vitals[];
};

const VitalsChart = ({ vitals }: VitalsChartProps) => {
    if (!vitals || vitals.length === 0) {
        return <div className="text-center text-gray-500 py-8">No vitals data available</div>;
    }
    
    return <>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Health Vitals Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
        <LineChart data={vitals}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sleepScore" stroke="#3b82f6" name="Sleep Score" strokeWidth={2} />
                    <Line type="monotone" dataKey="restingHR" stroke="#ef4444" name="Resting HR" strokeWidth={2} />
                    <Line type="monotone" dataKey="sleepingHR" stroke="#a855f7" name="Sleeping HR" strokeWidth={2} />
                    <Line type="monotone" dataKey="hrv" stroke="#22c55e" name="HRV" strokeWidth={2} />
                    <Line type="monotone" dataKey="stress" stroke="#f97316" name="Stress" strokeWidth={2} />
                </LineChart>
                </ResponsiveContainer>
        </>;
}

export default VitalsChart;
// File: components/analytics/AnalyticsChart.tsx
"use client"; // Đánh dấu đây là Client Component

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { FeedbackHistoryPoint } from '@/lib/actions/feedback.action';

interface AnalyticsChartProps {
  data: FeedbackHistoryPoint[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">
          No practice history available for this topic yet. Complete a session to see your progress!
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(4px)',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#4f46e5" // Màu indigo-600
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Total Score"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
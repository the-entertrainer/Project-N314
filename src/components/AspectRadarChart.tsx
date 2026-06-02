import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AspectSentiment } from '../types';

interface Props {
  data: AspectSentiment;
}

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

const AspectRadarChart: React.FC<Props> = ({ data }) => {
  const chartData = Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([key, value]) => ({ aspect: formatLabel(key), score: value as number }));

  if (chartData.length === 0) return null;

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-xl font-semibold text-gray-200 mb-4">Aspect Sentiment Analysis</h3>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#4b5563" />
            <PolarAngleAxis dataKey="aspect" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <PolarRadiusAxis domain={[-1, 1]} tick={{ fill: '#6b7280', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#e5e7eb' }}
              itemStyle={{ color: '#2dd4bf' }}
              formatter={(v: any) => (typeof v === 'number' ? v.toFixed(2) : v)}
            />
            <Radar
              name="Sentiment"
              dataKey="score"
              stroke="#2dd4bf"
              fill="#2dd4bf"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AspectRadarChart;

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
} from 'recharts';
import type { HistoricalDataPoint } from '../types';

interface Props {
  data: HistoricalDataPoint[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-3 bg-gray-700/80 backdrop-blur-sm border border-gray-600 rounded-md shadow-lg text-sm">
      <p className="font-bold text-gray-300 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.stroke || p.fill }}>
          {`${p.name}: ${(p.value || 0).toFixed(2)}`}
        </div>
      ))}
    </div>
  );
};

const SentimentChart: React.FC<Props> = ({ data }) => {
  const chartData = useMemo(() => {
    const withSentiment = data.filter(d => d.sentimentScore != null);

    return data.map((d, i, arr) => {
      const point: any = {
        ...d,
        name: new Date(d.date + '-02').toLocaleString('default', { month: 'short', year: '2-digit' }),
      };

      if (withSentiment.length >= 3) {
        const window = arr
          .slice(Math.max(0, i - 2), i + 1)
          .map(x => x.sentimentScore)
          .filter((s): s is number => s != null);

        if (window.length > 0) {
          const avg = window.reduce((a, b) => a + b, 0) / window.length;
          const stdDev = Math.sqrt(
            window.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / window.length
          );
          point.sma = avg;
          point.upperBand = avg + 2 * stdDev;
          point.lowerBand = avg - 2 * stdDev;
        }
      }
      return point;
    });
  }, [data]);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <h3 className="text-xl font-semibold text-gray-200 mb-4">Historical Sentiment Trend</h3>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="sentimentScore"
              name="Sentiment"
              stroke="#38bdf8"
              fillOpacity={1}
              fill="url(#colorSentiment)"
              connectNulls
            />
            <Line type="monotone" dataKey="upperBand" name="Upper Band" stroke="#f59e0b"
              strokeDasharray="5 5" dot={false} strokeWidth={1} connectNulls />
            <Line type="monotone" dataKey="lowerBand" name="Lower Band" stroke="#f59e0b"
              strokeDasharray="5 5" dot={false} strokeWidth={1} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentChart;

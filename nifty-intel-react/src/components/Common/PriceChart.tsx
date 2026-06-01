import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PriceChartProps {
  prices: number[];
  dates: string[];
  height?: number;
  title?: string;
}

export function PriceChart({
  prices,
  dates,
  height = 300,
  title,
}: PriceChartProps) {
  if (!prices || prices.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const data = prices.map((price, i) => ({
    date: dates[i] || new Date(Date.now() - (prices.length - i) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    price: parseFloat(price.toFixed(2)),
  }));

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  const padding = range * 0.05;

  return (
    <div>
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis
            stroke="#9ca3af"
            domain={[
              Math.floor(minPrice - padding),
              Math.ceil(maxPrice + padding),
            ]}
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
            formatter={(value: any) => `₹${Number(value).toFixed(2)}`}
            labelStyle={{ color: '#000' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PriceChart;

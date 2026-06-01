import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  prices: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({
  prices,
  width = 100,
  height = 40,
  color = '#3b82f6',
}: SparklineProps) {
  if (!prices || prices.length < 2) {
    return <div style={{ width, height }} className="bg-gray-100 rounded" />;
  }

  const data = prices.map((price, i) => ({
    index: i,
    price,
  }));

  const isGaining = prices[prices.length - 1] >= prices[0];
  const sparkColor = isGaining ? '#10b981' : '#ef4444';

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={sparkColor}
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default Sparkline;

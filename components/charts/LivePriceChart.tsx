'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
} from 'recharts';
import type { LiveChartPoint } from '../../hooks/useLiveChartData';

const tooltipStyle = {
  backgroundColor: '#18181b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
};

interface LivePriceChartProps {
  data: LiveChartPoint[];
  height?: number;
  color?: string;
  animationKey?: number;
  showLiveDot?: boolean;
}

export default function LivePriceChart({
  data,
  height = 240,
  color = '#10b981',
  animationKey = 0,
  showLiveDot = true,
}: LivePriceChartProps) {
  const last = data[data.length - 1];
  const domainPadding = last
    ? [last.close * 0.998, last.close * 1.002]
    : ['auto', 'auto'];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#52525b"
          fontSize={10}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          stroke="#52525b"
          fontSize={10}
          domain={domainPadding as [number, number]}
          tickFormatter={(v) => v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          width={48}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number) => [value.toLocaleString('en-IN'), 'Price']}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Line
          key={`live-line-${animationKey}`}
          type="monotone"
          dataKey="close"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          isAnimationActive
          animationDuration={2200}
          animationEasing="ease-in-out"
          activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
        {showLiveDot && last && (
          <ReferenceDot
            x={last.label}
            y={last.close}
            r={6}
            fill={color}
            stroke="#fff"
            strokeWidth={2}
            className="live-chart-dot"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
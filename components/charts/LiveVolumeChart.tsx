'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import type { LiveChartPoint } from '../../hooks/useLiveChartData';

const tooltipStyle = {
  backgroundColor: '#18181b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
};

interface LiveVolumeChartProps {
  data: LiveChartPoint[];
  height?: number;
  animationKey?: number;
}

export default function LiveVolumeChart({
  data,
  height = 200,
  animationKey = 0,
}: LiveVolumeChartProps) {
  const enriched = data.map((d, i) => ({
    ...d,
    fill: i === data.length - 1 ? '#60a5fa' : '#3b82f6',
    opacity: i === data.length - 1 ? 1 : 0.65,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={enriched} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
          tickFormatter={(v) => `${(v / 1e3).toFixed(0)}K`}
          width={42}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number) => [value.toLocaleString('en-IN'), 'Volume']}
        />
        <Bar
          key={`live-vol-${animationKey}`}
          dataKey="volume"
          radius={[3, 3, 0, 0]}
          isAnimationActive
          animationDuration={2200}
          animationEasing="ease-in-out"
        >
          {enriched.map((entry, i) => (
            <Cell key={i} fill={entry.fill} fillOpacity={entry.opacity} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
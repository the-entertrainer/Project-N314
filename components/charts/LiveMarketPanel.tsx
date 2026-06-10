'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { Activity, Radio } from 'lucide-react';
import { useLiveChartData } from '../../hooks/useLiveChartData';
import LivePriceChart from './LivePriceChart';
import LiveVolumeChart from './LiveVolumeChart';

interface HistoricalPoint {
  date: string;
  close?: number;
  volume?: number;
}

interface LiveMarketPanelProps {
  symbol?: string;
  title?: string;
  historicalData: HistoricalPoint[];
}

function formatChartDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const tooltipStyle = {
  backgroundColor: '#18181b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
};

export default function LiveMarketPanel({
  symbol = '^NSEI',
  title = 'NIFTY 50',
  historicalData,
}: LiveMarketPanelProps) {
  const [view, setView] = useState<'live' | 'history'>('live');
  const { points, quote, lastUpdated, isLoading, tick } = useLiveChartData({
    symbol,
    enabled: view === 'live',
    intervalMs: 8000,
  });

  const livePrice = quote?.regularMarketPrice ?? points[points.length - 1]?.close;
  const changePct = quote?.regularMarketChangePercent;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight">
              {title} · {view === 'live' ? 'Live Session' : '30 Day Trend'}
            </h3>
            {view === 'live' && (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Radio className="w-3 h-3 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          {view === 'live' && livePrice != null && (
            <div className="flex items-baseline gap-3 mt-1">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={livePrice}
                  initial={{ opacity: 0.6, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="text-2xl font-mono font-semibold text-emerald-400"
                >
                  {livePrice.toLocaleString('en-IN')}
                </motion.span>
              </AnimatePresence>
              {changePct != null && (
                <span
                  className={`text-sm font-medium ${changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {changePct >= 0 ? '+' : ''}
                  {changePct.toFixed(2)}%
                </span>
              )}
              {lastUpdated && (
                <span className="text-[10px] text-zinc-500">
                  Updated {lastUpdated.toLocaleTimeString('en-IN')}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex bg-zinc-900/80 rounded-xl p-1 border border-white/10 self-start">
          <button
            onClick={() => setView('live')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              view === 'live' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              view === 'history' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            30D
          </button>
        </div>
      </div>

      {view === 'live' ? (
        isLoading && points.length === 0 ? (
          <div className="glass-card p-12 text-center text-zinc-400 text-sm animate-pulse">
            Connecting to live market feed...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-4 sm:p-5">
              <div className="text-xs text-zinc-400 mb-3 flex items-center gap-2">
                <span className="live-pulse-dot" />
                Intraday Price (5m candles)
              </div>
              <LivePriceChart data={points} animationKey={tick} />
            </div>
            <div className="glass-card p-4 sm:p-5">
              <div className="text-xs text-zinc-400 mb-3 flex items-center gap-2">
                <span className="live-pulse-dot bg-blue-500" />
                Session Volume
              </div>
              <LiveVolumeChart data={points} animationKey={tick} />
            </div>
          </div>
        )
      ) : historicalData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-4 sm:p-5">
            <div className="text-xs text-zinc-400 mb-3">Closing Price</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  stroke="#3f3f46"
                  fontSize={10}
                  tickFormatter={formatChartDate}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  stroke="#3f3f46"
                  fontSize={10}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  width={42}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-4 sm:p-5">
            <div className="text-xs text-zinc-400 mb-3">Volume</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  stroke="#3f3f46"
                  fontSize={10}
                  tickFormatter={formatChartDate}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  stroke="#3f3f46"
                  fontSize={10}
                  tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
                  width={42}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-zinc-400 text-sm">Loading chart data...</div>
      )}
    </div>
  );
}
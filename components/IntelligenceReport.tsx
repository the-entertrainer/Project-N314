'use client';

import { useState } from 'react';
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
  ReferenceLine,
  ComposedChart,
  Area,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Brain,
  Globe,
  Loader2,
  Minus,
  Newspaper,
  Radio,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { AnalysisReport } from '../types/analysis';
import { useLiveChartData } from '../hooks/useLiveChartData';
import LivePriceChart from './charts/LivePriceChart';
import LiveVolumeChart from './charts/LiveVolumeChart';
import LivePriceTicker from './LivePriceTicker';
import SymbolAutocomplete from './SymbolAutocomplete';


const chartTooltip = {
  backgroundColor: '#18181b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles = {
    BUY: 'bg-emerald-500 text-black',
    HOLD: 'bg-amber-500 text-black',
    SELL: 'bg-red-500 text-white',
  }[verdict] || 'bg-zinc-500 text-white';

  return (
    <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${styles}`}>{verdict}</span>
  );
}

function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === 'bullish') return <ArrowUp className="w-4 h-4 text-emerald-400" />;
  if (sentiment === 'bearish') return <ArrowDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-amber-400" />;
}

function ConfidenceRing({ value, errorMargin }: { value: number; errorMargin: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#27272a" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{value}%</span>
        <span className="text-[10px] text-zinc-400">±{errorMargin}%</span>
      </div>
    </div>
  );
}

function ReportView({ report }: { report: AnalysisReport }) {
  const { analysis, technicals, chartSeries, news, globalIndices, symbol } = report;
  const { points: livePoints, quote: liveQuote, tick, lastUpdated } = useLiveChartData({
    symbol,
    enabled: true,
    intervalMs: 3000,
  });

  const quote = liveQuote
    ? { ...report.quote, ...liveQuote, regularMarketPrice: liveQuote.regularMarketPrice }
    : report.quote;

  const newsChartData = analysis.news_impacts.slice(0, 8).map((n) => ({
    name: n.headline.length > 28 ? n.headline.slice(0, 28) + '…' : n.headline,
    impact: n.impact_score,
    fill: n.impact_score >= 0 ? '#10b981' : '#ef4444',
  }));

  const signalChartData = analysis.technical_signals.map((s) => ({
    name: s.indicator,
    weight: s.weight,
    fill:
      s.signal === 'bullish' ? '#10b981' : s.signal === 'bearish' ? '#ef4444' : '#f59e0b',
  }));

  const priceRange = [
    { label: 'Current', value: quote.regularMarketPrice, fill: '#3b82f6' },
    { label: '7D Target', value: analysis.price_target_7d, fill: '#8b5cf6' },
    { label: '30D Target', value: analysis.price_target_30d, fill: '#10b981' },
    { label: 'Support', value: technicals.support, fill: '#f59e0b' },
    { label: 'Resistance', value: technicals.resistance, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero verdict */}
      <div className="glass-card p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold font-mono">{report.symbol}</h2>
              <VerdictBadge verdict={analysis.verdict} />
              <div className="flex items-center gap-1.5 text-sm capitalize text-zinc-300">
                <SentimentIcon sentiment={analysis.current_sentiment} />
                {analysis.current_sentiment}
              </div>
            </div>
            <p className="text-zinc-400 text-sm">{quote.shortName}</p>
            <p className="text-lg font-medium leading-relaxed">{analysis.headline_summary}</p>
            <p className="text-sm text-zinc-400 leading-relaxed">{analysis.executive_summary}</p>
          </div>
          <div className="text-center">
            <ConfidenceRing value={analysis.confidence} errorMargin={analysis.error_margin_pct} />
            <p className="text-xs text-zinc-500 mt-2">Model Confidence</p>
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Price', live: true, value: quote.regularMarketPrice, icon: Target },
          {
            label: '7D Target',
            value: `₹${analysis.price_target_7d.toLocaleString('en-IN')}`,
            icon: TrendingUp,
          },
          {
            label: '30D Target',
            value: `₹${analysis.price_target_30d.toLocaleString('en-IN')}`,
            icon: Sparkles,
          },
          {
            label: 'RSI (14)',
            value: technicals.rsi?.toFixed(1) ?? '—',
            icon: Brain,
          },
        ].map(({ label, value, icon: Icon, live }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <Icon className="w-3.5 h-3.5" />
              {label}
              {live && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                </span>
              )}
            </div>
            <div className="text-lg font-mono font-semibold">
              {live ? (
                <>
                  ₹<LivePriceTicker price={value as number} className="text-emerald-400" />
                </>
              ) : (
                value
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Live intraday session */}
      {livePoints.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-4 sm:p-5">
            <div className="text-xs text-zinc-400 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="live-pulse-dot" />
                Live Intraday Price
              </span>
              {lastUpdated && (
                <span className="text-[10px] text-zinc-500">
                  {lastUpdated.toLocaleTimeString('en-IN')}
                </span>
              )}
            </div>
            <LivePriceChart data={livePoints} animationKey={tick} height={220} />
          </div>
          <div className="glass-card p-4 sm:p-5">
            <div className="text-xs text-zinc-400 mb-3 flex items-center gap-2">
              <span className="live-pulse-dot bg-blue-500" />
              Live Session Volume
            </div>
            <LiveVolumeChart data={livePoints} animationKey={tick} height={220} />
          </div>
        </div>
      )}

      {/* Price chart with SMAs */}
      <div className="glass-card p-4 sm:p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Price Action & Moving Averages
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="#52525b" fontSize={10} minTickGap={30} />
            <YAxis stroke="#52525b" fontSize={10} domain={['auto', 'auto']} width={50} />
            <Tooltip contentStyle={chartTooltip} />
            <Area type="monotone" dataKey="close" fill="#10b981" fillOpacity={0.08} stroke="none" isAnimationActive animationDuration={2000} animationEasing="ease-in-out" />
            <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2.5} dot={false} name="Close" isAnimationActive animationDuration={2200} animationEasing="ease-in-out" />
            <Line type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="SMA 50" connectNulls isAnimationActive animationDuration={2200} animationEasing="ease-in-out" />
            <Line type="monotone" dataKey="sma200" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="SMA 200" connectNulls isAnimationActive animationDuration={2200} animationEasing="ease-in-out" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI + MACD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-3">RSI (14)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartSeries.filter((d) => d.rsi !== null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#52525b" fontSize={9} minTickGap={40} />
              <YAxis domain={[0, 100]} stroke="#52525b" fontSize={10} width={35} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
              <Tooltip contentStyle={chartTooltip} />
              <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} isAnimationActive animationDuration={2000} animationEasing="ease-in-out" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-3">MACD</h3>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={chartSeries.filter((d) => d.macd !== null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#52525b" fontSize={9} minTickGap={40} />
              <YAxis stroke="#52525b" fontSize={10} width={45} />
              <Tooltip contentStyle={chartTooltip} />
              <Bar dataKey="macdHistogram" name="Histogram" radius={[2, 2, 0, 0]}>
                {chartSeries
                  .filter((d) => d.macdHistogram !== null)
                  .map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={(entry.macdHistogram ?? 0) >= 0 ? '#10b981' : '#ef4444'}
                    />
                  ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="MACD" isAnimationActive animationDuration={2000} animationEasing="ease-in-out" />
              <Line type="monotone" dataKey="macdSignal" stroke="#ec4899" strokeWidth={1.5} dot={false} name="Signal" isAnimationActive animationDuration={2000} animationEasing="ease-in-out" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* News impact + price targets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-blue-400" />
            News Impact Analysis
          </h3>
          {newsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={newsChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" domain={[-10, 10]} stroke="#52525b" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={9} width={90} />
                <ReferenceLine x={0} stroke="#52525b" />
                <Tooltip contentStyle={chartTooltip} />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                  {newsChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-8">No news impact data</p>
          )}
        </div>

        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-4">Price Levels & Targets</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priceRange}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="label" stroke="#52525b" fontSize={10} />
              <YAxis stroke="#52525b" fontSize={10} domain={['auto', 'auto']} width={55} />
              <Tooltip contentStyle={chartTooltip} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priceRange.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Technical signal weights */}
      <div className="glass-card p-4 sm:p-5">
        <h3 className="text-sm font-semibold mb-4">Technical Signal Weights</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={signalChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
            <YAxis stroke="#52525b" fontSize={10} domain={[0, 100]} width={35} />
            <Tooltip contentStyle={chartTooltip} />
            <Bar dataKey="weight" radius={[6, 6, 0, 0]}>
              {signalChartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
          {analysis.technical_signals.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs bg-zinc-900/50 rounded-xl px-3 py-2">
              <span className="text-zinc-400">{s.indicator}</span>
              <span className="font-mono">{s.value}</span>
              <span
                className={
                  s.signal === 'bullish'
                    ? 'text-emerald-400'
                    : s.signal === 'bearish'
                      ? 'text-red-400'
                      : 'text-amber-400'
                }
              >
                {s.signal}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Global context */}
      <div className="glass-card p-4 sm:p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          Global Market Context
        </h3>
        <p className="text-sm text-zinc-300 leading-relaxed mb-4">{analysis.global_context}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {globalIndices.map((idx) => (
            <div key={idx.symbol} className="bg-zinc-900/60 rounded-xl p-3 text-center">
              <div className="text-[10px] text-zinc-500">{idx.name}</div>
              <div className="font-mono text-sm mt-1">{idx.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div
                className={`text-xs mt-0.5 ${idx.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {idx.changePercent >= 0 ? '+' : ''}
                {idx.changePercent.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News impacts detail */}
      <div className="glass-card p-4 sm:p-5">
        <h3 className="text-sm font-semibold mb-4">Event-Driven Reasoning</h3>
        <div className="space-y-3">
          {analysis.news_impacts.map((item, i) => (
            <div key={i} className="border border-white/5 rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium flex-1">{item.headline}</p>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    item.impact_score >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {item.impact_score >= 0 ? '+' : ''}
                  {item.impact_score}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {item.source} · {item.time_horizon}-term
              </p>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{item.reasoning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Catalysts & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-400">
            <Sparkles className="w-4 h-4" />
            Catalysts
          </h3>
          <ul className="space-y-2">
            {analysis.catalysts.map((c, i) => (
              <li key={i} className="text-sm text-zinc-300 flex gap-2">
                <span className="text-emerald-500 shrink-0">+</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-400">
            <Shield className="w-4 h-4" />
            Risk Factors
          </h3>
          <ul className="space-y-2">
            {analysis.risk_factors.map((r, i) => (
              <li key={i} className="text-sm text-zinc-300 flex gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reasoning chain */}
      <div className="glass-card p-4 sm:p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          Analysis Reasoning Chain
        </h3>
        <ol className="space-y-3">
          {analysis.reasoning_chain.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="shrink-0 w-6 h-6 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-zinc-300 leading-relaxed pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Raw news feed */}
      {news.length > 0 && (
        <div className="glass-card p-4 sm:p-5">
          <h3 className="text-sm font-semibold mb-3">Source Headlines ({news.length})</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {news.slice(0, 10).map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-zinc-400 hover:text-emerald-400 transition-colors py-1"
              >
                [{article.category}] {article.title}
              </a>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-zinc-600 text-center pb-4">
        Generated {new Date(report.generatedAt).toLocaleString()} · Powered by Groq · Not financial advice
      </p>
    </div>
  );
}

export default function IntelligenceReport() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content:
        'Enter a stock symbol (e.g. RELIANCE.NS, TCS.NS, AAPL) to run a full intelligence analysis combining global news, technical indicators, and Groq-powered predictions.',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const runAnalysis = async () => {
    if (!symbol.trim() || loading) return;
    setLoading(true);
    setError('');
    setReport(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch {
      setError('Failed to connect to analysis engine');
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;
    setChatMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const context = report
        ? `\n\nCurrent analysis context: ${report.symbol} verdict=${report.analysis.verdict}, confidence=${report.analysis.confidence}%, price=₹${report.quote.regularMarketPrice}`
        : '';
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed + context }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.success ? data.response : data.error || 'Error' },
      ]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to connect to Groq.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">AI Intelligence</h2>
        <p className="text-zinc-400 text-sm mt-1">Groq · Global News · Technical Analysis</p>
      </div>

      {/* Analysis input */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <SymbolAutocomplete
            value={symbol}
            onChange={setSymbol}
            onSubmit={runAnalysis}
            disabled={loading}
            placeholder="Search Nifty 500 — RELIANCE, TCS, INFY…"
          />
          <button
            onClick={runAnalysis}
            disabled={loading || !symbol.trim()}
            className="btn-primary px-6 py-3 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Run Intelligence'}
          </button>
        </div>
        {loading && (
          <div className="mt-4 space-y-2">
            {['Fetching market data...', 'Collecting global news...', 'Computing indicators...', 'Running Groq reasoning...'].map(
              (step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {step}
                </div>
              )
            )}
          </div>
        )}
        {error && (
          <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </div>

      {report && <ReportView report={report} />}

      {/* Quick chat */}
      <div className="glass-card flex flex-col min-h-[300px]">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold">Ask Follow-up Questions</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[320px]">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : ''}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                  msg.role === 'user' ? 'bg-emerald-600' : 'bg-zinc-800 border border-white/10'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && <div className="text-xs text-zinc-500">Groq is thinking...</div>}
        </div>
        <div className="p-3 border-t border-white/10 flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="Ask about risks, news impact, or alternatives..."
            className="input-field flex-1"
            disabled={chatLoading}
          />
          <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="btn-primary px-4">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useMemo, useState } from 'react';
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { useAppStore } from '../../store/appStore';
import { useStockHistory } from '../../hooks/useStockDetail';
import { calcSMA } from '../../utils/technical';
import { fmtPrice, fmtPct, fmtMktCap, fmtNum, fmtVol } from '../../utils/formatters';
import type { StockAiAnalysis, StockQuote } from '../../types';

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg p-2 text-xs border border-white/10 shadow-xl">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-mono">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : '—'}
        </p>
      ))}
    </div>
  );
};

const FundGrid: React.FC<{ q: StockQuote; rsi14?: number }> = ({ q, rsi14 }) => {
  const items = [
    { label: 'CMP',        value: fmtPrice(q.price) },
    { label: 'Change',     value: fmtPct(q.changePct), colored: true, v: q.changePct },
    { label: 'Mkt Cap',    value: fmtMktCap(q.marketCap) },
    { label: 'P/E',        value: q.pe != null ? fmtNum(q.pe, 1) : '—' },
    { label: 'P/B',        value: q.pb != null ? fmtNum(q.pb, 1) : '—' },
    { label: 'EPS',        value: q.eps != null ? fmtPrice(q.eps) : '—' },
    { label: 'Div Yield',  value: q.divYield != null ? `${q.divYield.toFixed(2)}%` : '—' },
    { label: 'Beta',       value: q.beta != null ? fmtNum(q.beta, 2) : '—' },
    { label: '52W High',   value: fmtPrice(q.high52w) },
    { label: '52W Low',    value: fmtPrice(q.low52w) },
    { label: 'Volume',     value: fmtVol(q.volume) },
    { label: 'RSI-14',     value: rsi14 != null ? fmtNum(rsi14, 1) : '—',
      colored: rsi14 != null, v: rsi14 != null ? (rsi14 > 70 ? -1 : rsi14 < 30 ? -1 : 1) : 0 },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map(({ label, value, colored, v }) => (
        <div key={label} className="glass-card rounded-lg p-3">
          <p className="text-xs text-white/40 font-mono">{label}</p>
          <p className={`text-sm font-bold mt-0.5 ${colored && v != null ? (v >= 0 ? 'text-teal-400' : 'text-red-400') : 'text-white'}`}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
};

const AiPanel: React.FC<{ quote: StockQuote; headlines: string[] }> = ({ quote, headlines }) => {
  const [analysis, setAnalysis] = useState<StockAiAnalysis | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const { analyzeStock } = await import('../../services/geminiService');
      const result = await analyzeStock(quote, [], headlines);
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const actionColor = (a: string) =>
    a === 'Buy' ? 'text-teal-300' : a === 'Sell' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">AI Analysis</h3>
        <button
          onClick={run}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze with AI'}
        </button>
      </div>

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      {!analysis && !loading && (
        <p className="text-xs text-white/30">Click "Analyze with AI" to get Gemini's assessment based on live market data.</p>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 skeleton rounded" />)}
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-4">
          {/* Short Term */}
          <div className="p-3 rounded-lg bg-white/3 border border-white/8">
            <p className="text-xs text-white/40 mb-2 font-mono uppercase">Short Term (1–5 days)</p>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xl font-black ${actionColor(analysis.shortTerm.action)}`}>
                {analysis.shortTerm.action}
              </span>
              <span className="text-xs text-white/40">
                Confidence: <span className="text-white/70">{analysis.shortTerm.confidence}%</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs font-mono">
              <div><span className="text-white/40">Entry</span><br /><span className="text-white">{fmtPrice(analysis.shortTerm.entry)}</span></div>
              <div><span className="text-white/40">Target</span><br /><span className="text-teal-300">{fmtPrice(analysis.shortTerm.target)}</span></div>
              <div><span className="text-white/40">Stop-Loss</span><br /><span className="text-red-400">{fmtPrice(analysis.shortTerm.stopLoss)}</span></div>
            </div>
            <p className="text-xs text-white/60">{analysis.shortTerm.reasoning}</p>
          </div>

          {/* Long Term */}
          <div className="p-3 rounded-lg bg-white/3 border border-white/8">
            <p className="text-xs text-white/40 mb-1 font-mono uppercase">Long Term ({analysis.longTerm.timeframe})</p>
            <p className="text-xs text-white/70">{analysis.longTerm.thesis}</p>
          </div>

          {/* Risks */}
          <div>
            <p className="text-xs text-white/40 mb-1 font-mono uppercase">Key Risks</p>
            <ul className="space-y-1">
              {analysis.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                  <span className="text-red-400 mt-0.5">•</span>{r}
                </li>
              ))}
            </ul>
          </div>

          {/* Key Levels */}
          <div className="flex gap-4 text-xs font-mono">
            <span className="text-white/40">Support: <span className="text-teal-300">{fmtPrice(analysis.keyLevels.support)}</span></span>
            <span className="text-white/40">Resistance: <span className="text-red-400">{fmtPrice(analysis.keyLevels.resistance)}</span></span>
          </div>
        </div>
      )}
    </div>
  );
};

const DeepDive: React.FC = () => {
  const selectedTicker    = useAppStore((s) => s.selectedTicker);
  const setSelectedTicker = useAppStore((s) => s.setSelectedTicker);
  const setActiveTab      = useAppStore((s) => s.setActiveTab);
  const quotes            = useAppStore((s) => s.quotes);
  const news              = useAppStore((s) => s.news);

  const quote = selectedTicker ? quotes.get(selectedTicker) : null;
  const { data, isLoading } = useStockHistory(selectedTicker);

  const chartData = useMemo(() => {
    if (!data?.bars.length) return [];
    const closes      = data.bars.map((b) => b.close);
    const ma50Array   = calcSMA(closes, 50);
    const ma200Array  = calcSMA(closes, 200);
    return data.bars.map((b, i) => ({
      date:   b.date.slice(5),
      price:  b.close,
      ma50:   isNaN(ma50Array[i]) ? null : +ma50Array[i].toFixed(2),
      ma200:  isNaN(ma200Array[i]) ? null : +ma200Array[i].toFixed(2),
      volume: b.volume,
    }));
  }, [data?.bars.length]);

  const headlines = useMemo(
    () => news.slice(0, 5).map((n) => n.title),
    [news.length]
  );

  if (!selectedTicker) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-white/30 space-y-2">
        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-sm">Select a stock from the Screener to analyze</p>
        <button
          onClick={() => setActiveTab('screener')}
          className="px-4 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 transition-colors mt-2"
        >
          Go to Screener
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setSelectedTicker(null); setActiveTab('screener'); }}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <BackIcon />
        </button>
        <div className="flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-white">{selectedTicker}</h1>
            {quote && <span className="text-white/40 text-sm">{quote.name}</span>}
            {quote?.sector && <span className="text-xs text-white/30 font-mono">{quote.sector}</span>}
            {quote?.isFno && <span className="text-xs px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-mono">F&O</span>}
          </div>
          {quote && (
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xl font-bold text-white">{fmtPrice(quote.price)}</span>
              <span className={`text-sm font-semibold ${quote.changePct >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                {fmtPct(quote.changePct)} ({quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)})
              </span>
              {quote.grade && (
                <span className="text-xs px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono">
                  Score: {quote.score} ({quote.grade})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-xs text-white/30 font-mono mb-3">Price Chart — 1Y with MA50 / MA200</p>
        {isLoading ? (
          <div className="h-64 skeleton rounded-lg" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => `₹${v.toFixed(0)}`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="volume" name="Volume" fill="rgba(99,102,241,0.15)" yAxisId={1} />
              <Area dataKey="price" name="Price" type="monotone" stroke="#14b8a6" fill="rgba(20,184,166,0.08)" strokeWidth={1.5} dot={false} />
              <Line dataKey="ma50"  name="MA50"  type="monotone" stroke="#f59e0b" strokeWidth={1} dot={false} connectNulls />
              <Line dataKey="ma200" name="MA200" type="monotone" stroke="#8b5cf6" strokeWidth={1} dot={false} connectNulls />
              <YAxis yAxisId={1} hide />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-white/30 text-sm">
            Chart data unavailable
          </div>
        )}
      </div>

      {/* Fundamentals */}
      {quote && (
        <div>
          <p className="text-xs text-white/30 font-mono uppercase tracking-widest mb-2">Fundamentals</p>
          <FundGrid q={quote} rsi14={data?.indicators?.rsi14} />
        </div>
      )}

      {/* AI Analysis */}
      {quote && <AiPanel quote={quote} headlines={headlines} />}
    </div>
  );
};

export default DeepDive;

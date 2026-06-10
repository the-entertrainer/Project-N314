'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Brain,
  Calendar,
  HardDrive,
  Loader2,
  Minus,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
  AlertTriangle,
} from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import { usePortfolioInsightsStore } from '../store/portfolioInsightsStore';
import SymbolAutocomplete from './SymbolAutocomplete';

interface MarketQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
}

function SentimentPill({ sentiment }: { sentiment: string }) {
  const styles = {
    Bullish: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Bearish: 'bg-red-500/15 text-red-400 border-red-500/30',
    Neutral: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  }[sentiment] || 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles}`}>
      {sentiment}
    </span>
  );
}

function ImpactBadge({ impact }: { impact: 'positive' | 'negative' | 'neutral' }) {
  const styles = {
    positive: 'text-emerald-400 bg-emerald-500/10',
    negative: 'text-red-400 bg-red-500/10',
    neutral: 'text-amber-400 bg-amber-500/10',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${styles[impact]}`}>
      {impact}
    </span>
  );
}

export default function Portfolio() {
  const { holdings, addHolding, removeHolding, clearPortfolio } = usePortfolioStore();
  const { insight, loading, error, lastFetched, fetchInsights, clearInsights } =
    usePortfolioInsightsStore();

  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [stockChanges, setStockChanges] = useState<Record<string, number>>({});
  const [newSymbol, setNewSymbol] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [newAvgPrice, setNewAvgPrice] = useState('');

  const fetchPrices = useCallback(async () => {
    if (holdings.length === 0) {
      setStockPrices({});
      setStockChanges({});
      return;
    }
    const symbols = holdings.map((h) => h.symbol).join(',');
    try {
      const res = await fetch(`/api/market?symbols=${encodeURIComponent(symbols)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const prices: Record<string, number> = {};
        const changes: Record<string, number> = {};
        json.data.forEach((quote: MarketQuote) => {
          if (quote.symbol && quote.regularMarketPrice) {
            prices[quote.symbol] = quote.regularMarketPrice;
          }
          if (quote.symbol && quote.regularMarketChangePercent != null) {
            changes[quote.symbol] = quote.regularMarketChangePercent;
          }
        });
        setStockPrices(prices);
        setStockChanges(changes);
      }
    } catch (e) {
      console.error(e);
    }
  }, [holdings]);

  const portfolioValue = holdings.reduce((sum, holding) => {
    const currentPrice = stockPrices[holding.symbol] || holding.avgPrice;
    return sum + holding.quantity * currentPrice;
  }, 0);

  const totalInvested = holdings.reduce(
    (sum, holding) => sum + holding.quantity * holding.avgPrice,
    0
  );
  const totalGainLoss = portfolioValue - totalInvested;
  const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  const holdingsFingerprint = holdings
    .map((h) => `${h.symbol}:${h.quantity}:${h.avgPrice}`)
    .sort()
    .join('|');
  const prevFingerprint = useRef(holdingsFingerprint);

  const runInsights = useCallback(async () => {
    if (holdings.length === 0) return;
    await fetchInsights(holdings, {
      portfolioValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercent,
      prices: stockPrices,
      changes: stockChanges,
    });
  }, [
    holdings,
    portfolioValue,
    totalInvested,
    totalGainLoss,
    totalGainLossPercent,
    stockPrices,
    stockChanges,
    fetchInsights,
  ]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  useEffect(() => {
    if (holdings.length === 0) {
      clearInsights();
      prevFingerprint.current = '';
      return;
    }
    if (prevFingerprint.current === holdingsFingerprint) return;
    prevFingerprint.current = holdingsFingerprint;
    fetchPrices().then(() => runInsights());
  }, [holdingsFingerprint, holdings.length, clearInsights, fetchPrices, runInsights]);

  const handleAddHolding = () => {
    const qty = parseFloat(newQuantity);
    const price = parseFloat(newAvgPrice);
    if (!newSymbol.trim() || qty <= 0 || price <= 0) return;
    const symbol = newSymbol.toUpperCase().trim().includes('.NS')
      ? newSymbol.toUpperCase().trim()
      : `${newSymbol.toUpperCase().trim()}.NS`;
    addHolding({ symbol, quantity: qty, avgPrice: price });
    setNewSymbol('');
    setNewQuantity('1');
    setNewAvgPrice('');
  };

  const handleClear = () => {
    clearPortfolio();
    clearInsights();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Portfolio</h2>
          <p className="text-zinc-400 mt-1 text-sm flex items-center gap-2 flex-wrap">
            AI-powered tracking & daily advice
            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded-full">
              <HardDrive className="w-3 h-3" />
              Saved locally
            </span>
          </p>
        </div>
        {holdings.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            Clear
          </button>
        )}
      </div>

      {/* Groq intelligence panel */}
      {holdings.length > 0 && (
        <div className="glass-card p-5 sm:p-6 space-y-5 border-emerald-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold">Groq Portfolio Intelligence</h3>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
            </div>
            {insight && <SentimentPill sentiment={insight.current_tracking.overall_sentiment} />}
          </div>

          {error && (
            <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              {error}
              {insight && <span className="block text-xs text-zinc-500 mt-1">Showing last cached analysis.</span>}
            </div>
          )}

          {loading && !insight ? (
            <div className="space-y-2 py-4">
              {['Analyzing holdings…', 'Scanning market events…', 'Generating predictions…'].map(
                (step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {step}
                  </div>
                )
              )}
            </div>
          ) : insight ? (
            <div className="space-y-5">
              <p className="text-sm text-zinc-300 leading-relaxed">{insight.portfolio_summary}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 rounded-2xl p-4">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                    P&L Outlook
                  </div>
                  <p className="text-sm text-zinc-300">{insight.current_tracking.total_pnl_outlook}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-2xl p-4">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Daily Advice
                  </div>
                  <p className="text-sm text-emerald-300/90">{insight.daily_advice}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 rounded-2xl p-4">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    7-Day Prediction
                  </div>
                  <p className="text-sm text-zinc-400">{insight.predictions.short_term_7d}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-2xl p-4">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                    30-Day Prediction
                  </div>
                  <p className="text-sm text-zinc-400">{insight.predictions.medium_term_30d}</p>
                </div>
              </div>

              {insight.current_tracking.holdings_snapshot.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Holdings Tracking
                  </h4>
                  <div className="space-y-2">
                    {insight.current_tracking.holdings_snapshot.map((h) => (
                      <div
                        key={h.symbol}
                        className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm bg-zinc-900/40 rounded-xl px-3 py-2"
                      >
                        <span className="font-mono font-semibold text-emerald-400 w-28 shrink-0">
                          {h.symbol}
                        </span>
                        <span className="text-zinc-400 flex-1">{h.status}</span>
                        <span className="text-zinc-500 text-xs">{h.pnl_view}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insight.upcoming_events.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Upcoming Events
                  </h4>
                  <div className="space-y-2">
                    {insight.upcoming_events.map((evt, i) => (
                      <div key={i} className="border border-white/5 rounded-xl p-3">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <ImpactBadge impact={evt.impact} />
                          <span className="text-[10px] text-zinc-500">{evt.date_or_timing}</span>
                        </div>
                        <p className="text-sm text-zinc-300">{evt.event}</p>
                        {evt.affected_symbols.length > 0 && (
                          <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                            {evt.affected_symbols.join(' · ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insight.risk_alerts.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Risk Alerts
                  </h4>
                  <ul className="space-y-1.5">
                    {insight.risk_alerts.map((risk, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex gap-2">
                        <span className="text-amber-500 shrink-0">!</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lastFetched && (
                <p className="text-[10px] text-zinc-600 text-center">
                  Updated {new Date(lastFetched).toLocaleString('en-IN')} · Not financial advice
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5 sm:p-6">
            <div className="text-xs text-zinc-400 tracking-widest uppercase">Total Value</div>
            <div className="text-4xl sm:text-5xl font-mono tracking-tight mt-1 text-emerald-400">
              ₹{portfolioValue.toLocaleString('en-IN')}
            </div>
            {holdings.length > 0 && (
              <div
                className={`flex items-center gap-1.5 mt-2 text-sm font-medium ${
                  totalGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {totalGainLoss >= 0 ? (
                  <ArrowUp className="w-4 h-4" />
                ) : (
                  <ArrowDown className="w-4 h-4" />
                )}
                {totalGainLoss >= 0 ? '+' : ''}₹{totalGainLoss.toLocaleString('en-IN')} (
                {totalGainLossPercent.toFixed(1)}%)
              </div>
            )}
          </div>

          <div className="glass-card p-5 sm:p-6">
            <h3 className="text-sm font-medium mb-4">Add Holding</h3>
            <div className="space-y-3">
              <SymbolAutocomplete
                value={newSymbol}
                onChange={setNewSymbol}
                placeholder="Search Nifty 500 symbol…"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="input-field"
                  min="1"
                />
                <input
                  type="number"
                  placeholder="Avg Price (₹)"
                  value={newAvgPrice}
                  onChange={(e) => setNewAvgPrice(e.target.value)}
                  className="input-field"
                  min="0"
                  step="0.01"
                />
              </div>
              <button onClick={handleAddHolding} className="btn-secondary w-full py-3">
                Add Holding
              </button>
            </div>
          </div>

          {holdings.length > 0 && (
            <button
              onClick={handleClear}
              className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 text-sm text-red-400 border border-red-500/30 rounded-2xl hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Portfolio
            </button>
          )}
        </div>

        <div className="lg:col-span-3">
          {holdings.length === 0 ? (
            <div className="glass-card p-12 text-center text-sm text-zinc-400">
              No holdings yet. Add stocks to get Groq-powered tracking, predictions, and daily
              advice on every visit. Your portfolio is saved locally in this browser.
            </div>
          ) : (
            <div className="space-y-3">
              {holdings.map((holding, index) => {
                const currentPrice = stockPrices[holding.symbol] || holding.avgPrice;
                const currentValue = holding.quantity * currentPrice;
                const gainLoss = currentValue - holding.quantity * holding.avgPrice;
                const gainLossPercent =
                  ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;
                const hasLivePrice = !!stockPrices[holding.symbol];

                return (
                  <div
                    key={index}
                    className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-lg">{holding.symbol}</span>
                        {!hasLivePrice && (
                          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                            cached
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {holding.quantity} shares × ₹{holding.avgPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="font-mono text-lg">
                          ₹{currentValue.toLocaleString('en-IN')}
                        </div>
                        <div
                          className={`text-xs flex items-center justify-end gap-1 ${
                            gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {gainLoss >= 0 ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : gainLoss < 0 ? (
                            <ArrowDown className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          {gainLoss >= 0 ? '+' : ''}₹{gainLoss.toFixed(0)} (
                          {gainLossPercent.toFixed(1)}%)
                        </div>
                      </div>
                      <button
                        onClick={() => removeHolding(holding.symbol)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Minus,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import type { Nifty500Stock, ScreenerRow, SentimentResult } from '../types/screener';

const WATCHLIST_KEY = 'n314-watchlist';
const BATCH_SIZE = 40;
const ROW_HEIGHT_MOBILE = 96;
const ROW_HEIGHT_DESKTOP = 52;

const DESKTOP_GRID =
  'grid-cols-[7.5rem_minmax(0,1.6fr)_minmax(0,1fr)_5.75rem_4.75rem_8.75rem] gap-x-3';

interface MarketQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
}

interface SentimentResponse {
  success: boolean;
  error?: string;
  code?: string;
  ticker?: string;
  companyName?: string;
  industry?: string;
  headline_count?: number;
  analysis?: SentimentResult;
}

type SortKey = 'symbol' | 'companyName' | 'industry' | 'price' | 'change';
type SortDir = 'asc' | 'desc';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function SentimentBadge({ sentiment }: { sentiment: SentimentResult['sentiment'] }) {
  const styles = {
    Bullish: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Bearish: 'bg-red-500/15 text-red-400 border-red-500/30',
    Neutral: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[sentiment]}`}>
      {sentiment}
    </span>
  );
}

export default function Screener() {
  const [registry, setRegistry] = useState<Nifty500Stock[]>([]);
  const [registryLoading, setRegistryLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [priceMap, setPriceMap] = useState<Record<string, MarketQuote>>({});
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);
  const [sentimentResult, setSentimentResult] = useState<SentimentResponse | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      if (saved) setWatchlist(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    let cancelled = false;

    async function loadRegistry() {
      setRegistryLoading(true);
      try {
        const res = await fetch('/api/screener');
        const json = await res.json();
        if (!cancelled && json.success) setRegistry(json.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setRegistryLoading(false);
      }
    }

    loadRegistry();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPricesBatched = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    setPricesLoading(true);

    try {
      for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        const batch = symbols.slice(i, i + BATCH_SIZE);
        const res = await fetch(`/api/market?symbols=${encodeURIComponent(batch.join(','))}`);
        const json = await res.json();

        if (json.success && json.data) {
          setPriceMap((prev) => {
            const next = { ...prev };
            json.data.forEach((q: MarketQuote) => {
              if (q.symbol) next[q.symbol] = q;
            });
            return next;
          });
        }

        if (i + BATCH_SIZE < symbols.length) await sleep(150);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPricesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (registry.length === 0) return;
    const symbols = registry.map((s) => s.symbol);
    fetchPricesBatched(symbols);
  }, [registry, fetchPricesBatched]);

  const rows: ScreenerRow[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    let filtered = registry;

    if (q) {
      filtered = registry.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.companyName.toLowerCase().includes(q) ||
          s.industry.toLowerCase().includes(q)
      );
    }

    const enriched = filtered.map((stock) => {
      const quote = priceMap[stock.symbol];
      return {
        ...stock,
        regularMarketPrice: quote?.regularMarketPrice,
        regularMarketChangePercent: quote?.regularMarketChangePercent,
        regularMarketVolume: quote?.regularMarketVolume,
      };
    });

    enriched.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'symbol':
          cmp = a.symbol.localeCompare(b.symbol);
          break;
        case 'companyName':
          cmp = a.companyName.localeCompare(b.companyName);
          break;
        case 'industry':
          cmp = a.industry.localeCompare(b.industry);
          break;
        case 'price':
          cmp = (a.regularMarketPrice ?? -1) - (b.regularMarketPrice ?? -1);
          break;
        case 'change':
          cmp =
            (a.regularMarketChangePercent ?? -Infinity) -
            (b.regularMarketChangePercent ?? -Infinity);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return enriched;
  }, [registry, query, priceMap, sortKey, sortDir]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isDesktop ? ROW_HEIGHT_DESKTOP : ROW_HEIGHT_MOBILE),
    overscan: 12,
  });

  useEffect(() => {
    rowVirtualizer.measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  const toggleWatchlist = (symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'change' || key === 'price' ? 'desc' : 'asc');
    }
  };

  const analyzeSentiment = async (symbol: string) => {
    setSelectedTicker(symbol);
    setSentimentLoading(true);
    setSentimentError(null);
    setSentimentResult(null);

    try {
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: symbol }),
      });
      const json: SentimentResponse = await res.json();

      if (!res.ok || !json.success) {
        setSentimentError(
          json.error ||
            (res.status === 429
              ? 'Rate limit reached. Wait 30–60 seconds and try again.'
              : 'Sentiment analysis failed.')
        );
        return;
      }

      setSentimentResult(json);
    } catch {
      setSentimentError('Network error. Please try again.');
    } finally {
      setSentimentLoading(false);
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const watchlistRows = useMemo(
    () =>
      watchlist
        .map((symbol) => {
          const stock = registry.find((s) => s.symbol === symbol);
          if (!stock) return null;
          const quote = priceMap[symbol];
          return {
            ...stock,
            regularMarketPrice: quote?.regularMarketPrice,
            regularMarketChangePercent: quote?.regularMarketChangePercent,
          } as ScreenerRow;
        })
        .filter((r): r is ScreenerRow => r !== null),
    [watchlist, registry, priceMap]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Nifty 500 Screener</h2>
        <p className="text-zinc-400 mt-1 text-sm">
          {registry.length > 0
            ? `${registry.length} NSE stocks · official .NS tickers`
            : 'Loading Nifty 500 registry…'}
          {pricesLoading && (
            <span className="inline-flex items-center gap-1.5 ml-2 text-emerald-400/80">
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating prices
            </span>
          )}
        </p>
      </div>

      <input
        type="text"
        placeholder="Search by symbol, company, or sector…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="input-field"
      />

      {sentimentResult?.analysis && selectedTicker && (
        <div className="glass-card p-5 space-y-4 border-emerald-500/20">
          <div className="flex justify-between items-start gap-3">
            <div>
              <div className="font-mono font-semibold text-lg">{sentimentResult.ticker}</div>
              <div className="text-sm text-zinc-400">{sentimentResult.companyName}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{sentimentResult.industry}</div>
            </div>
            <button
              onClick={() => {
                setSentimentResult(null);
                setSelectedTicker(null);
              }}
              className="p-2 text-zinc-500 hover:text-zinc-300 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SentimentBadge sentiment={sentimentResult.analysis.sentiment} />
            <span className="font-mono text-sm text-zinc-300">
              Score: {sentimentResult.analysis.sentiment_score.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-500 capitalize">
              {sentimentResult.analysis.news_scope} news
            </span>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed">
            {sentimentResult.analysis.predicted_trend}
          </p>

          <ul className="space-y-1.5">
            {sentimentResult.analysis.news_drivers.map((driver, i) => (
              <li key={i} className="text-sm text-zinc-400 flex gap-2">
                <span className="text-emerald-500 shrink-0">•</span>
                {driver}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sentimentError && (
        <div className="glass-card p-4 border-red-500/30 text-red-400 text-sm flex justify-between items-center gap-3">
          <span>{sentimentError}</span>
          <button onClick={() => setSentimentError(null)} className="shrink-0 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {registryLoading ? (
        <div className="text-center py-16 text-zinc-400">Loading Nifty 500 registry…</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div
            className={`hidden sm:grid ${DESKTOP_GRID} px-4 py-3 border-b border-white/10 text-xs font-medium text-zinc-400 tracking-wider bg-zinc-950/60 items-center`}
          >
            <button onClick={() => toggleSort('symbol')} className="text-left hover:text-zinc-200">
              Ticker{sortIndicator('symbol')}
            </button>
            <button onClick={() => toggleSort('companyName')} className="text-left hover:text-zinc-200">
              Company{sortIndicator('companyName')}
            </button>
            <button onClick={() => toggleSort('industry')} className="text-left hover:text-zinc-200">
              Sector{sortIndicator('industry')}
            </button>
            <button onClick={() => toggleSort('price')} className="text-right hover:text-zinc-200 justify-self-end w-full">
              Price{sortIndicator('price')}
            </button>
            <button onClick={() => toggleSort('change')} className="text-right hover:text-zinc-200 justify-self-end w-full">
              Change{sortIndicator('change')}
            </button>
            <span className="text-center justify-self-center">Actions</span>
          </div>

          <div
            ref={parentRef}
            className="h-[min(60vh,520px)] overflow-y-auto no-scrollbar"
          >
            {rows.length === 0 ? (
              <div className="p-10 text-center text-zinc-400">No matching stocks.</div>
            ) : (
              <div
                style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const stock = rows[virtualRow.index];
                  const isPositive = (stock.regularMarketChangePercent ?? 0) >= 0;
                  const watching = watchlist.includes(stock.symbol);
                  const isAnalyzing =
                    sentimentLoading && selectedTicker === stock.symbol;

                  return (
                    <div
                      key={stock.symbol}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Mobile row */}
                      <div className="sm:hidden h-full px-4 py-3 flex flex-col justify-center gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono font-semibold text-sm leading-tight">{stock.symbol}</div>
                            <div className="text-xs text-zinc-400 truncate mt-0.5">{stock.companyName}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="font-mono text-sm tabular-nums leading-tight">
                              {stock.regularMarketPrice != null
                                ? `₹${stock.regularMarketPrice.toLocaleString('en-IN')}`
                                : '—'}
                            </div>
                            {stock.regularMarketChangePercent != null ? (
                              <div
                                className={`text-xs font-medium tabular-nums mt-0.5 ${
                                  isPositive ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {isPositive ? '+' : ''}
                                {stock.regularMarketChangePercent.toFixed(2)}%
                              </div>
                            ) : (
                              <div className="text-xs text-zinc-500 mt-0.5">—</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => toggleWatchlist(stock.symbol)}
                            className={`h-8 w-8 inline-flex items-center justify-center rounded-xl transition-colors ${
                              watching
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                            title={watching ? 'Remove from watchlist' : 'Add to watchlist'}
                          >
                            <Star className={`w-4 h-4 ${watching ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => analyzeSentiment(stock.symbol)}
                            disabled={sentimentLoading}
                            className="h-8 px-2.5 text-xs rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-colors"
                          >
                            {isAnalyzing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            Analyze
                          </button>
                        </div>
                      </div>

                      {/* Desktop row */}
                      <div
                        className={`hidden sm:grid ${DESKTOP_GRID} h-full px-4 items-center`}
                      >
                        <div className="font-mono font-semibold text-sm truncate">{stock.symbol}</div>
                        <div className="text-sm text-zinc-400 truncate">{stock.companyName}</div>
                        <div className="text-xs text-zinc-500 truncate">{stock.industry}</div>
                        <div className="text-right font-mono text-sm tabular-nums justify-self-end w-full">
                          {stock.regularMarketPrice != null
                            ? `₹${stock.regularMarketPrice.toLocaleString('en-IN')}`
                            : '—'}
                        </div>
                        <div className="text-right text-sm font-medium tabular-nums justify-self-end w-full">
                          {stock.regularMarketChangePercent != null ? (
                            <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                              {isPositive ? '+' : ''}
                              {stock.regularMarketChangePercent.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-1 justify-self-center">
                          <button
                            onClick={() => toggleWatchlist(stock.symbol)}
                            className={`h-8 w-8 inline-flex items-center justify-center rounded-xl transition-colors shrink-0 ${
                              watching
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                            title={watching ? 'Remove from watchlist' : 'Add to watchlist'}
                          >
                            <Star className={`w-4 h-4 ${watching ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => analyzeSentiment(stock.symbol)}
                            disabled={sentimentLoading}
                            className="h-8 px-2 text-xs rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 disabled:opacity-50 inline-flex items-center justify-center gap-1 transition-colors shrink-0 whitespace-nowrap"
                          >
                            {isAnalyzing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            Analyze
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-white/10 text-xs text-zinc-500">
            Showing {rows.length} of {registry.length} stocks
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Watchlist ({watchlist.length})</h3>
        {watchlist.length === 0 ? (
          <div className="border border-dashed border-white/20 rounded-3xl p-8 text-center text-sm text-zinc-400">
            Tap ★ on any stock to add it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {watchlistRows.map((stock) => {
              const isPositive = (stock.regularMarketChangePercent ?? 0) >= 0;
              return (
                <div
                  key={stock.symbol}
                  className="glass-card p-4 flex justify-between items-center gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-mono font-semibold">{stock.symbol}</div>
                    <div className="text-xs text-zinc-400 truncate">{stock.companyName}</div>
                    <div className="font-mono mt-1">
                      {stock.regularMarketPrice != null
                        ? `₹${stock.regularMarketPrice.toLocaleString('en-IN')}`
                        : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {stock.regularMarketChangePercent != null ? (
                      <span
                        className={`text-sm font-medium flex items-center gap-0.5 ${
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : stock.regularMarketChangePercent < 0 ? (
                          <ArrowDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        {isPositive ? '+' : ''}
                        {stock.regularMarketChangePercent.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-sm">—</span>
                    )}
                    <button
                      onClick={() => toggleWatchlist(stock.symbol)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
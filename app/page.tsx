'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
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
import { ArrowDown, ArrowUp, Minus, Send, Star, Trash2, X } from 'lucide-react';
import { usePortfolioStore } from '../store/portfolioStore';
import ThreeDOrb from '../components/ThreeDOrb';
import AppShell, { AppTab } from '../components/AppShell';

interface MarketQuote {
  symbol: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
}

interface HistoricalDataPoint {
  date: string;
  close?: number;
  volume?: number;
}

const WATCHLIST_KEY = 'n314-watchlist';
const columnHelper = createColumnHelper<MarketQuote>();

function formatIndexLabel(symbol?: string) {
  const labels: Record<string, string> = {
    '^NSEI': 'NIFTY 50',
    '^NSEBANK': 'BANK NIFTY',
    '^BSESN': 'SENSEX',
  };
  return labels[symbol || ''] || symbol?.replace('^', '') || '—';
}

function formatChartDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function N314() {
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [marketData, setMarketData] = useState<MarketQuote[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [screenerData, setScreenerData] = useState<MarketQuote[]>([]);
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your N314 AI Stock Advisor. Ask me about any NSE stock, market trends, or your portfolio.",
    },
  ]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { holdings, addHolding, removeHolding, clearPortfolio } = usePortfolioStore();

  const [newSymbol, setNewSymbol] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [newAvgPrice, setNewAvgPrice] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 1200);
    return () => clearTimeout(timer);
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
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, aiLoading]);

  const fetchMarketData = async () => {
    try {
      const res = await fetch('/api/market?type=indices');
      const json = await res.json();
      if (json.success) setMarketData(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistorical = async () => {
    try {
      const res = await fetch('/api/market?type=historical&symbol=^NSEI');
      const json = await res.json();
      if (json.success) setHistoricalData(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchScreenerData = async () => {
    setScreenerLoading(true);
    try {
      const res = await fetch('/api/market?type=popular');
      const json = await res.json();
      if (json.success) setScreenerData(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setScreenerLoading(false);
    }
  };

  const fetchPortfolioPrices = useCallback(async () => {
    if (holdings.length === 0) {
      setStockPrices({});
      return;
    }
    const symbols = holdings.map((h) => h.symbol).join(',');
    try {
      const res = await fetch(`/api/market?symbols=${encodeURIComponent(symbols)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const priceMap: Record<string, number> = {};
        json.data.forEach((quote: MarketQuote) => {
          if (quote.symbol && quote.regularMarketPrice) {
            priceMap[quote.symbol] = quote.regularMarketPrice;
          }
        });
        setStockPrices(priceMap);
      }
    } catch (e) {
      console.error(e);
    }
  }, [holdings]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMarketData(), fetchHistorical()]);
      setIsLoading(false);
    };
    loadData();

    const interval = setInterval(() => {
      fetchMarketData();
      fetchPortfolioPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPortfolioPrices]);

  useEffect(() => {
    fetchPortfolioPrices();
  }, [fetchPortfolioPrices]);

  useEffect(() => {
    if (activeTab === 'screener' && screenerData.length === 0) {
      fetchScreenerData();
    }
  }, [activeTab, screenerData.length]);

  const toggleWatchlist = (symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const isInWatchlist = useCallback((symbol: string) => watchlist.includes(symbol), [watchlist]);

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

  const handleAddHolding = () => {
    const qty = parseFloat(newQuantity);
    const price = parseFloat(newAvgPrice);
    if (!newSymbol.trim() || qty <= 0 || price <= 0) return;
    addHolding({
      symbol: newSymbol.toUpperCase().trim(),
      quantity: qty,
      avgPrice: price,
    });
    setNewSymbol('');
    setNewQuantity('1');
    setNewAvgPrice('');
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || aiLoading) return;
    const userMessage = { role: 'user' as const, content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error || 'Sorry, something went wrong.' },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Failed to connect to AI.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('symbol', {
        header: 'Symbol',
        cell: (info) => (
          <span className="font-mono font-semibold tracking-tight">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('shortName', {
        header: 'Name',
        cell: (info) => <span className="text-zinc-400">{info.getValue() || '—'}</span>,
      }),
      columnHelper.accessor('regularMarketPrice', {
        header: 'Price',
        cell: (info) => (
          <span className="font-mono">₹{info.getValue()?.toLocaleString('en-IN') || '—'}</span>
        ),
      }),
      columnHelper.accessor('regularMarketChangePercent', {
        header: 'Change',
        cell: (info) => {
          const val = info.getValue();
          if (val === undefined) return <span className="text-zinc-500">—</span>;
          const positive = val >= 0;
          return (
            <span className={positive ? 'text-emerald-400' : 'text-red-400'}>
              {positive ? '+' : ''}
              {val.toFixed(2)}%
            </span>
          );
        },
      }),
      columnHelper.accessor('regularMarketVolume', {
        header: 'Volume',
        cell: (info) =>
          info.getValue() ? (
            <span className="text-zinc-400">{(info.getValue()! / 1_000_000).toFixed(1)}M</span>
          ) : (
            <span className="text-zinc-500">—</span>
          ),
      }),
      columnHelper.accessor('symbol', {
        id: 'watchlist',
        header: '',
        cell: (info) => {
          const symbol = info.getValue();
          const watching = isInWatchlist(symbol);
          return (
            <button
              onClick={() => toggleWatchlist(symbol)}
              className={`px-3 py-1.5 text-xs rounded-full transition-all active:scale-95 ${
                watching
                  ? 'bg-emerald-500 text-black font-medium'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
              }`}
            >
              {watching ? '★ Watching' : '☆ Watch'}
            </button>
          );
        },
      }),
    ],
    [isInWatchlist]
  );

  const table = useReactTable({
    data: screenerData,
    columns,
    state: { globalFilter, sorting },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const filteredRows = table.getRowModel().rows;

  const chartTooltipStyle = {
    backgroundColor: '#18181b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    fontSize: '12px',
  };

  return (
    <>
      <AnimatePresence>
        {showPreloader && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950"
          >
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <ThreeDOrb size="lg" />
              </div>
              <div className="text-4xl sm:text-5xl font-semibold tracking-tight">N314</div>
              <div className="text-emerald-400 text-[10px] tracking-[0.25em] mt-2 uppercase">
                Stock Intelligence
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 lg:space-y-8">
            <div className="lg:hidden">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Market Overview</h2>
              <p className="text-zinc-400 mt-1 text-sm sm:text-base">
                Real-time insights across major Indian indices
              </p>
            </div>

            {isLoading && marketData.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card p-6 h-36 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {marketData.map((quote, i) => {
                  const isPositive = (quote.regularMarketChangePercent || 0) >= 0;
                  return (
                    <div
                      key={i}
                      className="glass-card p-5 sm:p-6 hover:border-emerald-500/20 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-zinc-500 tracking-wider uppercase truncate">
                            {formatIndexLabel(quote.symbol)}
                          </div>
                          <div className="text-3xl sm:text-4xl font-mono tracking-tight mt-1 tabular-nums">
                            {quote.regularMarketPrice?.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div
                          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          {isPositive ? '+' : ''}
                          {quote.regularMarketChangePercent?.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight mb-4">
                NIFTY 50 · 30 Day Trend
              </h3>
              {historicalData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="glass-card p-4 sm:p-5">
                    <div className="text-xs text-zinc-400 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Closing Price
                    </div>
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
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Line
                          type="monotone"
                          dataKey="close"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="glass-card p-4 sm:p-5">
                    <div className="text-xs text-zinc-400 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      Volume
                    </div>
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
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-12 text-center text-zinc-400 text-sm">
                  Loading chart data...
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCREENER */}
        {activeTab === 'screener' && (
          <div className="space-y-6">
            <div className="lg:hidden">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Stock Screener</h2>
              <p className="text-zinc-400 mt-1 text-sm">Find and track opportunities</p>
            </div>

            <input
              type="text"
              placeholder="Search stocks..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="input-field"
            />

            {screenerLoading ? (
              <div className="text-center py-16 text-zinc-400">Loading data...</div>
            ) : (
              <>
                {/* Mobile card list */}
                <div className="md:hidden space-y-3">
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row) => {
                      const stock = row.original;
                      const isPositive = (stock.regularMarketChangePercent || 0) >= 0;
                      const watching = isInWatchlist(stock.symbol);
                      return (
                        <div key={row.id} className="glass-card p-4">
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <div className="font-mono font-semibold">{stock.symbol}</div>
                              <div className="text-xs text-zinc-400 truncate">
                                {stock.shortName || '—'}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleWatchlist(stock.symbol)}
                              className={`shrink-0 p-2 rounded-xl transition-colors ${
                                watching ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${watching ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          <div className="flex justify-between items-end mt-3 pt-3 border-t border-white/10">
                            <div className="font-mono text-lg">
                              ₹{stock.regularMarketPrice?.toLocaleString('en-IN') || '—'}
                            </div>
                            <div
                              className={`text-sm font-medium ${
                                isPositive ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {isPositive ? '+' : ''}
                              {stock.regularMarketChangePercent?.toFixed(2) ?? '—'}%
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="glass-card p-10 text-center text-zinc-400">No results found.</div>
                  )}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead className="bg-zinc-950/60 border-b border-white/10">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <th
                                key={header.id}
                                onClick={header.column.getToggleSortingHandler()}
                                className="px-5 py-4 text-left text-xs font-medium text-zinc-400 tracking-wider cursor-pointer hover:text-zinc-200"
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ??
                                  null}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredRows.length > 0 ? (
                          filteredRows.map((row) => (
                            <tr key={row.id} className="hover:bg-white/5 transition-colors">
                              {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="px-5 py-4">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-5 py-14 text-center text-zinc-400">
                              No results found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4">Watchlist ({watchlist.length})</h3>
              {watchlist.length === 0 ? (
                <div className="border border-dashed border-white/20 rounded-3xl p-8 text-center text-sm text-zinc-400">
                  Tap ★ on any stock to add it here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {watchlist.map((symbol) => {
                    const stock = screenerData.find((s) => s.symbol === symbol);
                    if (!stock) return null;
                    const isPositive = (stock.regularMarketChangePercent || 0) >= 0;
                    return (
                      <div
                        key={symbol}
                        className="glass-card p-4 flex justify-between items-center gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-semibold">{symbol}</div>
                          <div className="text-xs text-zinc-400 truncate">{stock.shortName}</div>
                          <div className="font-mono mt-1">
                            ₹{stock.regularMarketPrice?.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm font-medium ${
                              isPositive ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {stock.regularMarketChangePercent?.toFixed(2)}%
                          </span>
                          <button
                            onClick={() => toggleWatchlist(symbol)}
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
        )}

        {/* AI */}
        {activeTab === 'ai' && (
          <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
            <div className="lg:hidden mb-4">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">AI Stock Advisor</h2>
              <p className="text-zinc-400 text-sm mt-1">Google Gemini 2.0 Flash</p>
            </div>

            <div className="glass-card flex flex-col flex-1 min-h-[420px] sm:min-h-[500px] lg:min-h-[calc(100dvh-12rem)]">
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <div
                      className={`max-w-[90%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800/80 border border-white/10'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 px-1">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.15s' }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.3s' }}
                      />
                    </div>
                    Thinking...
                  </div>
                )}
              </div>

              <div className="p-3 sm:p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about the market..."
                    className="input-field flex-1"
                    disabled={aiLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={aiLoading || !input.trim()}
                    className="btn-primary px-4 sm:px-5 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PORTFOLIO */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center lg:hidden">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Portfolio</h2>
              </div>
              {holdings.length > 0 && (
                <button
                  onClick={clearPortfolio}
                  className="text-xs px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

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
                    <input
                      type="text"
                      placeholder="Symbol (e.g. RELIANCE.NS)"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      className="input-field"
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
                    onClick={clearPortfolio}
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
                    No holdings yet. Add your first one to start tracking.
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
                              <span className="font-mono font-semibold text-lg">
                                {holding.symbol}
                              </span>
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
        )}
      </AppShell>
    </>
  );
}
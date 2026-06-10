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
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { usePortfolioStore } from '../store/portfolioStore';
import ThreeDOrb from '../components/ThreeDOrb';

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

const columnHelper = createColumnHelper<MarketQuote>();

export default function N314() {
  const [activeTab, setActiveTab] = useState<'overview' | 'screener' | 'ai' | 'portfolio'>('overview');
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
    { role: 'assistant', content: "Hello! I'm your N314 AI Stock Advisor. Ask me about any NSE stock, market trends, or your portfolio." }
  ]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { holdings, addHolding, removeHolding, clearPortfolio } = usePortfolioStore();

  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 1400);
    return () => clearTimeout(timer);
  }, []);

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
    if (holdings.length === 0) return;
    const symbols = holdings.map(h => h.symbol).join(',');
    try {
      const res = await fetch(`/api/market?symbols=${symbols}`);
      const json = await res.json();
      if (json.success && json.data) {
        const priceMap: Record<string, number> = {};
        json.data.forEach((quote: any) => {
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
    if (activeTab === 'screener' && screenerData.length === 0) {
      fetchScreenerData();
    }
  }, [activeTab, screenerData.length]);

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol) 
        : [...prev, symbol]
    );
  };

  const isInWatchlist = useCallback((symbol: string) => watchlist.includes(symbol), [watchlist]);

  const portfolioValue = holdings.reduce((sum, holding) => {
    const currentPrice = stockPrices[holding.symbol] || holding.avgPrice;
    return sum + (holding.quantity * currentPrice);
  }, 0);

  const addSampleHolding = () => {
    addHolding({ symbol: 'RELIANCE.NS', quantity: 10, avgPrice: 2450 });
  };

  const [newSymbol, setNewSymbol] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newAvgPrice, setNewAvgPrice] = useState(0);

  const handleAddHolding = () => {
    if (!newSymbol.trim() || newQuantity <= 0 || newAvgPrice <= 0) return;
    addHolding({
      symbol: newSymbol.toUpperCase().trim(),
      quantity: newQuantity,
      avgPrice: newAvgPrice,
    });
    setNewSymbol('');
    setNewQuantity(1);
    setNewAvgPrice(0);
  };

  const sendMessage = async () => {
    if (!input.trim() || aiLoading) return;
    const userMessage = { role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Sorry, something went wrong.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to AI.' }]);
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

  const columns = useMemo(() => [
    columnHelper.accessor('symbol', {
      header: 'Symbol',
      cell: info => <span className="font-mono font-semibold tracking-tight">{info.getValue()}</span>,
    }),
    columnHelper.accessor('shortName', {
      header: 'Name',
      cell: info => <span className="text-zinc-400">{info.getValue() || '—'}</span>,
    }),
    columnHelper.accessor('regularMarketPrice', {
      header: 'Price',
      cell: info => <span className="font-mono">{info.getValue()?.toLocaleString('en-IN') || '—'}</span>,
    }),
    columnHelper.accessor('regularMarketChangePercent', {
      header: 'Change',
      cell: info => {
        const val = info.getValue();
        if (val === undefined) return <span className="text-zinc-500">—</span>;
        const positive = val >= 0;
        return <span className={positive ? 'text-emerald-400' : 'text-red-400'}>{positive ? '+' : ''}{val.toFixed(2)}%</span>;
      },
    }),
    columnHelper.accessor('regularMarketVolume', {
      header: 'Volume',
      cell: info => info.getValue() ? <span className="text-zinc-400">{(info.getValue()! / 1_000_000).toFixed(1)}M</span> : <span className="text-zinc-500">—</span>,
    }),
    columnHelper.accessor('symbol', {
      id: 'watchlist',
      header: '',
      cell: info => {
        const symbol = info.getValue();
        return (
          <button 
            onClick={() => toggleWatchlist(symbol)}
            className={`px-3.5 py-1 text-xs rounded-full transition-all active:scale-95 ${isInWatchlist(symbol) ? 'bg-emerald-500 text-black font-medium' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}
          >
            {isInWatchlist(symbol) ? '★ Watching' : '☆ Watch'}
          </button>
        );
      },
    }),
  ], [isInWatchlist]);

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

  return (
    <>
      <AnimatePresence>
        {showPreloader && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <ThreeDOrb />
              </div>
              <div>
                <div className="text-5xl font-semibold tracking-[-2.5px]">N314</div>
                <div className="text-emerald-400 text-sm tracking-[3px] mt-1">STOCK INTELLIGENCE</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30">
        {/* Premium Header */}
        <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <ThreeDOrb />
                <div>
                  <div className="text-3xl font-semibold tracking-[-1.5px]">N314</div>
                  <div className="text-[10px] text-zinc-500 -mt-1 tracking-[1.5px]">STOCK INTELLIGENCE</div>
                </div>
              </div>
            </div>

            <nav className="flex items-center gap-1.5 text-sm font-medium bg-zinc-900/60 p-1 rounded-3xl border border-white/10">
              {(['overview', 'screener', 'ai', 'portfolio'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-3xl transition-all capitalize ${activeTab === tab ? 'bg-white text-black shadow-sm' : 'hover:bg-white/5 text-zinc-400 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                LIVE MARKET
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-10">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="text-6xl font-semibold tracking-[-2.5px]">Market Overview</div>
                  <p className="text-zinc-400 mt-2 text-lg">Real-time insights across major Indian indices</p>
                </div>
              </div>

              {isLoading && marketData.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {[1,2,3].map(i => <div key={i} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 h-44 animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
                  {marketData.map((quote, i) => {
                    const isPositive = (quote.regularMarketChangePercent || 0) >= 0;
                    return (
                      <motion.div 
                        key={i} 
                        whileHover={{ y: -2 }}
                        className="bg-zinc-900 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-zinc-500 tracking-wider">{quote.symbol?.replace('^', '')}</div>
                            <div className="text-5xl font-mono tracking-[-1.5px] mt-3 tabular-nums">{quote.regularMarketPrice?.toLocaleString('en-IN')}</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {isPositive ? '+' : ''}{quote.regularMarketChangePercent?.toFixed(2)}%
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-3xl font-semibold tracking-tight">NIFTY 50 • 30 Day Trend</div>
                </div>
                {historicalData.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-7">
                      <div className="text-sm text-zinc-400 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" /> Closing Price
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={historicalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#3f3f46" fontSize={11} />
                          <YAxis stroke="#3f3f46" fontSize={11} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-7">
                      <div className="text-sm text-zinc-400 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" /> Volume
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={historicalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#3f3f46" fontSize={11} />
                          <YAxis stroke="#3f3f46" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }} />
                          <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : <div className="bg-zinc-900 border border-white/10 rounded-3xl p-16 text-center text-zinc-400">Loading chart data...</div>}
              </div>
            </>
          )}

          {/* SCREENER + WATCHLIST */}
          {activeTab === 'screener' && (
            <div className="space-y-10">
              <div>
                <div className="text-5xl font-semibold tracking-[-2px] mb-2">Stock Screener</div>
                <p className="text-zinc-400 text-lg">Discover and track high-potential stocks</p>
              </div>

              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="Search by symbol or name..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="flex-1 max-w-md bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-500"
                />
              </div>

              {screenerLoading ? (
                <div className="text-center py-20 text-zinc-400">Loading market data...</div>
              ) : (
                <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id} className="border-b border-white/10 bg-zinc-950/60">
                          {headerGroup.headers.map(header => (
                            <th
                              key={header.id}
                              className="px-8 py-5 text-left text-xs font-medium text-zinc-400 tracking-wider cursor-pointer select-none"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: ' ↑', desc: ' ↓',
                              }[header.column.getIsSorted() as string] ?? null}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map(row => (
                          <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id} className="px-8 py-5 text-sm">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-8 py-16 text-center text-zinc-400">No stocks match your search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Watchlist */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="text-2xl font-semibold tracking-tight">Your Watchlist <span className="text-sm text-zinc-500 font-normal">({watchlist.length})</span></div>
                </div>

                {watchlist.length === 0 ? (
                  <div className="border border-dashed border-white/20 rounded-3xl p-12 text-center text-zinc-400">
                    No stocks in watchlist yet.<br />Click the Watch button on any stock above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {watchlist.map(symbol => {
                      const stock = screenerData.find(s => s.symbol === symbol);
                      if (!stock) return null;
                      const isPositive = (stock.regularMarketChangePercent || 0) >= 0;
                      return (
                        <div key={symbol} className="bg-zinc-900 border border-white/10 rounded-3xl p-6 flex justify-between items-center group">
                          <div>
                            <div className="font-mono text-xl tracking-tight">{symbol}</div>
                            <div className="text-sm text-zinc-400 mt-0.5 line-clamp-1">{stock.shortName}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-lg">{stock.regularMarketPrice?.toLocaleString('en-IN')}</div>
                            <div className={`text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{stock.regularMarketChangePercent?.toFixed(2)}%
                            </div>
                          </div>
                          <button onClick={() => toggleWatchlist(symbol)} className="ml-4 text-red-400/70 hover:text-red-400 transition-colors text-2xl leading-none">×</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI CHAT */}
          {activeTab === 'ai' && (
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <div className="text-5xl font-semibold tracking-[-2px]">AI Stock Advisor</div>
                <p className="text-zinc-400 mt-3 text-lg">Powered by Google Gemini 2.0 Flash</p>
              </div>

              <div className="bg-zinc-900 border border-white/10 rounded-3xl flex flex-col h-[620px] overflow-hidden">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] px-6 py-4 rounded-3xl text-[15px] leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 border border-white/10'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 border border-white/10 px-6 py-4 rounded-3xl flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                        <span className="text-xs text-zinc-400">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-white/10 bg-zinc-950/60">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about any stock, sector, or market movement..."
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/60 text-[15px] placeholder:text-zinc-500"
                      disabled={aiLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={aiLoading || !input.trim()}
                      className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 px-9 rounded-2xl font-medium transition-all disabled:opacity-50"
                    >Send</button>
                  </div>
                  <div className="text-center text-[10px] text-zinc-500 mt-3 tracking-wider">NOT FINANCIAL ADVICE • FOR INFORMATIONAL PURPOSES ONLY</div>
                </div>
              </div>
            </div>
          )}

          {/* PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <div className="text-5xl font-semibold tracking-[-2px]">My Portfolio</div>
                  <p className="text-zinc-400 mt-2 text-lg">Real-time performance tracking</p>
                </div>
                <button onClick={clearPortfolio} className="text-sm px-5 py-2.5 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Clear All Holdings</button>
              </div>

              <div className="bg-zinc-900 border border-white/10 rounded-3xl p-9 mb-8">
                <div className="text-sm text-zinc-400 tracking-wider">TOTAL PORTFOLIO VALUE</div>
                <div className="text-7xl font-mono tracking-[-3.5px] mt-2 text-emerald-400">₹{portfolioValue.toLocaleString('en-IN')}</div>
              </div>

              <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 mb-8">
                <div className="font-medium mb-5 tracking-tight">Add New Holding</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" placeholder="Symbol (e.g. RELIANCE.NS)" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} className="bg-zinc-950 border border-white/10 rounded-2xl px-5 py-3 focus:outline-none focus:border-emerald-500/50" />
                  <input type="number" placeholder="Quantity" value={newQuantity} onChange={(e) => setNewQuantity(Number(e.target.value))} className="bg-zinc-950 border border-white/10 rounded-2xl px-5 py-3 focus:outline-none focus:border-emerald-500/50" />
                  <input type="number" placeholder="Avg Buy Price (₹)" value={newAvgPrice} onChange={(e) => setNewAvgPrice(Number(e.target.value))} className="bg-zinc-950 border border-white/10 rounded-2xl px-5 py-3 focus:outline-none focus:border-emerald-500/50" />
                  <button onClick={handleAddHolding} className="bg-white text-black hover:bg-zinc-200 active:bg-zinc-300 rounded-2xl font-medium transition-colors">Add to Portfolio</button>
                </div>
              </div>

              {holdings.length === 0 ? (
                <div className="border border-dashed border-white/20 rounded-3xl p-16 text-center text-zinc-400">
                  Your portfolio is empty.<br />Use the form above to add your first holding.
                </div>
              ) : (
                <div className="space-y-3">
                  {holdings.map((holding, index) => {
                    const currentPrice = stockPrices[holding.symbol] || holding.avgPrice;
                    const currentValue = holding.quantity * currentPrice;
                    const gainLoss = currentValue - (holding.quantity * holding.avgPrice);
                    const gainLossPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;

                    return (
                      <div key={index} className="bg-zinc-900 border border-white/10 rounded-3xl px-8 py-6 flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                          <div>
                            <div className="font-mono text-2xl tracking-tight">{holding.symbol}</div>
                            <div className="text-sm text-zinc-400 mt-px">{holding.quantity} shares @ avg ₹{holding.avgPrice}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 text-right">
                          <div>
                            <div className="font-mono text-xl tracking-tight">₹{currentValue.toFixed(0)}</div>
                            <div className={`text-sm tabular-nums ${gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {gainLoss >= 0 ? '+' : ''}₹{gainLoss.toFixed(0)} ({gainLossPercent.toFixed(1)}%)
                            </div>
                          </div>
                          <button onClick={() => removeHolding(holding.symbol)} className="opacity-40 hover:opacity-100 text-red-400 transition-all px-3 py-1 text-sm">Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

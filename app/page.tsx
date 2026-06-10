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
    const timer = setTimeout(() => setShowPreloader(false), 1200);
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
  }, [activeTab]);

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol) 
        : [...prev, symbol]
    );
  };

  const isInWatchlist = (symbol: string) => watchlist.includes(symbol);

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
      cell: info => <span className="font-mono font-semibold">{info.getValue()}</span>,
    }),
    columnHelper.accessor('shortName', {
      header: 'Name',
      cell: info => info.getValue() || '—',
    }),
    columnHelper.accessor('regularMarketPrice', {
      header: 'Price',
      cell: info => info.getValue()?.toLocaleString('en-IN') || '—',
    }),
    columnHelper.accessor('regularMarketChangePercent', {
      header: 'Change %',
      cell: info => {
        const val = info.getValue();
        if (val === undefined) return '—';
        return <span className={val >= 0 ? 'text-emerald-400' : 'text-red-400'}>{val >= 0 ? '+' : ''}{val.toFixed(2)}%</span>;
      },
    }),
    columnHelper.accessor('regularMarketVolume', {
      header: 'Volume',
      cell: info => info.getValue() ? (info.getValue()! / 1_000_000).toFixed(1) + 'M' : '—',
    }),
    columnHelper.accessor('symbol', {
      id: 'watchlist',
      header: '',
      cell: info => {
        const symbol = info.getValue();
        return (
          <button 
            onClick={() => toggleWatchlist(symbol)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${isInWatchlist(symbol) ? 'bg-emerald-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600'}`}
          >
            {isInWatchlist(symbol) ? '★' : '☆'}
          </button>
        );
      },
    }),
  ], [watchlist]);

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
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950"
          >
            <div className="text-center">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-16 h-16 mx-auto mb-6 bg-emerald-500 rounded-2xl flex items-center justify-center"
              >
                <span className="text-4xl font-bold text-black">N</span>
              </motion.div>
              <p className="text-emerald-400 text-sm tracking-[4px]">N314 STOCK INTELLIGENCE</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-zinc-950 text-white">
        <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <ThreeDOrb />
                <div>
                  <h1 className="text-3xl font-semibold tracking-tighter">N314</h1>
                  <p className="text-xs text-zinc-500 -mt-1">STOCK INTELLIGENCE</p>
                </div>
              </div>
            </div>
            <nav className="flex gap-2 text-sm font-medium">
              <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Overview</button>
              <button onClick={() => setActiveTab('screener')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'screener' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Screener</button>
              <button onClick={() => setActiveTab('ai')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'ai' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>AI Insights</button>
              <button onClick={() => setActiveTab('portfolio')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'portfolio' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Portfolio</button>
            </nav>
            <div className="text-xs px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              LIVE
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          {activeTab === 'overview' && (
            <>
              <h2 className="text-5xl font-semibold tracking-tight mb-8">Market Overview</h2>

              {isLoading && marketData.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {[1,2,3].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-40 animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {marketData.map((quote, i) => {
                    const isPositive = (quote.regularMarketChangePercent || 0) >= 0;
                    return (
                      <motion.div 
                        key={i}
                        whileHover={{ y: -4 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 transition-all hover:border-emerald-500/30"
                      >
                        <div className="text-sm text-zinc-500">{quote.symbol?.replace('^', '')}</div>
                        <div className="text-4xl font-mono mt-3">{quote.regularMarketPrice?.toLocaleString('en-IN')}</div>
                        <div className={`mt-2 text-lg font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{quote.regularMarketChangePercent?.toFixed(2)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">NIFTY 50 - 30 Day Trend</h3>
                {historicalData.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                      <div className="text-sm text-zinc-400 mb-4">Closing Price</div>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={historicalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#52525b" />
                          <YAxis stroke="#52525b" domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
                          <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                      <div className="text-sm text-zinc-400 mb-4">Volume</div>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={historicalData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="date" stroke="#52525b" />
                          <YAxis stroke="#52525b" />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
                          <Bar dataKey="volume" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-400">Loading chart data...</div>}
              </div>
            </>
          )}

          {activeTab === 'screener' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-4xl font-semibold tracking-tight">Stock Screener</h2>
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 w-80 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {screenerLoading ? (
                <div className="text-center py-20 text-zinc-400">Loading popular stocks...</div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden mb-8">
                  <table className="w-full">
                    <thead className="bg-zinc-950 border-b border-zinc-800">
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th
                              key={header.id}
                              className="px-6 py-4 text-left text-sm font-medium text-zinc-400 cursor-pointer select-none"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: ' ↑',
                                desc: ' ↓',
                              }[header.column.getIsSorted() as string] ?? null}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map(row => (
                          <tr key={row.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id} className="px-6 py-4 text-sm">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">No stocks found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div>
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Watchlist <span className="text-sm text-zinc-400">({watchlist.length})</span>
                </h3>
                {watchlist.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 border border-zinc-800 rounded-3xl">No stocks in watchlist. Star stocks from the table above.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {watchlist.map(symbol => {
                      const stock = screenerData.find(s => s.symbol === symbol);
                      if (!stock) return null;
                      const isPositive = (stock.regularMarketChangePercent || 0) >= 0;
                      return (
                        <motion.div 
                          key={symbol}
                          whileHover={{ scale: 1.01 }}
                          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex justify-between items-center">
                          <div>
                            <div className="font-mono font-semibold">{symbol}</div>
                            <div className="text-sm text-zinc-400">{stock.shortName}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono">{stock.regularMarketPrice?.toLocaleString('en-IN')}</div>
                            <div className={`text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{stock.regularMarketChangePercent?.toFixed(2)}%
                            </div>
                          </div>
                          <button onClick={() => toggleWatchlist(symbol)} className="ml-4 text-red-400 hover:text-red-500 text-xl leading-none">×</button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h2 className="text-4xl font-semibold tracking-tight">AI Stock Advisor</h2>
                <p className="text-zinc-400 mt-2">Powered by Google Gemini • Ask about any NSE stock or market trend</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col h-[620px]">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {messages.map((msg, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[82%] px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600' : 'bg-zinc-800'}`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-800 px-5 py-3.5 rounded-3xl flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                        <span className="text-xs text-zinc-400 ml-2">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-zinc-800">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about Reliance, market outlook, or any stock..."
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded-2xl px-5 py-3 focus:outline-none focus:border-emerald-500 text-[15px]"
                      disabled={aiLoading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={aiLoading || !input.trim()}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 px-8 rounded-2xl font-medium transition-colors"
                    >Send</button>
                  </div>
                  <p className="text-[10px] text-center text-zinc-500 mt-2">Not financial advice. For informational purposes only.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-semibold tracking-tight">My Portfolio</h2>
                  <p className="text-zinc-400 mt-1">Real-time P&amp;L using live prices</p>
                </div>
                <button onClick={clearPortfolio} className="px-4 py-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 text-sm">
                  Clear Portfolio
                </button>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
                <div className="text-sm text-zinc-400">Total Portfolio Value</div>
                <div className="text-5xl font-mono mt-2 text-emerald-400">₹{portfolioValue.toLocaleString('en-IN')}</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
                <h4 className="font-medium mb-4">Add New Holding</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" placeholder="Symbol (e.g. TCS.NS)" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5" />
                  <input type="number" placeholder="Quantity" value={newQuantity} onChange={(e) => setNewQuantity(Number(e.target.value))} className="bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5" />
                  <input type="number" placeholder="Avg Buy Price" value={newAvgPrice} onChange={(e) => setNewAvgPrice(Number(e.target.value))} className="bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5" />
                  <button onClick={handleAddHolding} className="bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium">Add Holding</button>
                </div>
              </div>

              {holdings.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 border border-zinc-800 rounded-3xl">Your portfolio is empty. Add holdings above.</div>
              ) : (
                <div className="space-y-4">
                  {holdings.map((holding, index) => {
                    const currentPrice = stockPrices[holding.symbol] || holding.avgPrice;
                    const currentValue = holding.quantity * currentPrice;
                    const gainLoss = currentValue - (holding.quantity * holding.avgPrice);
                    const gainLossPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;

                    return (
                      <motion.div 
                        key={index}
                        whileHover={{ scale: 1.005 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex justify-between items-center">
                        <div>
                          <div className="font-mono text-xl">{holding.symbol}</div>
                          <div className="text-sm text-zinc-400 mt-1">
                            {holding.quantity} shares @ avg ₹{holding.avgPrice} → Current ₹{currentPrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-mono">₹{currentValue.toFixed(0)}</div>
                          <div className={`text-sm ${gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {gainLoss >= 0 ? '+' : ''}₹{gainLoss.toFixed(0)} ({gainLossPercent.toFixed(1)}%)
                          </div>
                        </div>
                        <button onClick={() => removeHolding(holding.symbol)} className="ml-6 text-red-400 hover:text-red-500 text-sm">Remove</button>
                      </motion.div>
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

'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Brain, User, RefreshCw } from 'lucide-react';

type MarketData = {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  shortName?: string;
};

export default function N314() {
  const [activeTab, setActiveTab] = useState<'overview' | 'screener' | 'ai'>('overview');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/market?type=indices');
      const { data } = await res.json();
      setMarketData(data || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const formatChange = (change?: number, percent?: number) => {
    if (!change || !percent) return '0.00';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center font-bold text-xl text-black">N</div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tighter">N314</h1>
              <p className="text-[10px] text-zinc-500 -mt-1">INTELLIGENCE PLATFORM</p>
            </div>
          </div>

          <nav className="hidden md:flex gap-2 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`px-6 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}
            >
              <TrendingUp size={18} /> Overview
            </button>
            <button 
              onClick={() => setActiveTab('screener')} 
              className={`px-6 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'screener' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}
            >
              <BarChart3 size={18} /> Screener
            </button>
            <button 
              onClick={() => setActiveTab('ai')} 
              className={`px-6 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'ai' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}
            >
              <Brain size={18} /> AI Insights
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={fetchMarketData} disabled={loading} className="p-2 hover:bg-zinc-800 rounded-xl">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="text-xs px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">LIVE NSE</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && (
          <>
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-5xl font-semibold tracking-tight">Market Overview</h2>
                <p className="text-zinc-500 mt-2">Real-time Indian market intelligence • Last updated: {lastUpdated.toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {marketData.length > 0 ? marketData.map((item, index) => (
                <div key={index} className="bg-zinc-900 border border-zinc-800/80 rounded-3xl p-8 hover:border-emerald-500/30 transition-all group">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-sm text-zinc-500 tracking-widest">{item.symbol.replace('^', '')}</div>
                      <div className="text-4xl font-semibold mt-3 font-mono">{item.regularMarketPrice?.toFixed(2) || '—'}</div>
                    </div>
                    <div className={`text-sm px-3 py-1 rounded-full ${ (item.regularMarketChangePercent || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400' }`}>
                      {(item.regularMarketChangePercent || 0) >= 0 ? '▲' : '▼'}
                    </div>
                  </div>
                  <div className={`mt-6 text-lg font-medium ${ (item.regularMarketChangePercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400' }`}>
                    {formatChange(item.regularMarketChange, item.regularMarketChangePercent)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{item.shortName}</div>
                </div>
              )) : (
                <div className="col-span-full text-center py-20 text-zinc-500">Loading live market data...</div>
              )}
            </div>

            <div className="mt-16">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">Popular Stocks <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded">via Yahoo Finance</span></h3>
              {/* Can extend later */}
            </div>
          </>
        )}

        {activeTab === 'screener' && <div className="p-12 text-center text-zinc-400">Step 2: TanStack Table Screener coming next</div>}
        {activeTab === 'ai' && <div className="p-12 text-center text-zinc-400">Step 3: Gemini-powered AI Advisor</div>}
      </main>
    </div>
  );
}

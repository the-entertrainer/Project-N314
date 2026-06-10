'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

export default function N314() {
  const [activeTab, setActiveTab] = useState<'overview' | 'screener' | 'ai'>('overview');
  const [marketData, setMarketData] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

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

  useEffect(() => {
    fetchMarketData();
    fetchHistorical();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center font-bold text-xl text-black">N</div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tighter">N314</h1>
              <p className="text-xs text-zinc-500 -mt-1">STOCK INTELLIGENCE</p>
            </div>
          </div>
          <nav className="flex gap-2 text-sm font-medium">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Overview</button>
            <button onClick={() => setActiveTab('screener')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'screener' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Screener</button>
            <button onClick={() => setActiveTab('ai')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'ai' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>AI Insights</button>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {marketData.length > 0 ? marketData.map((quote: any, i: number) => {
                const isPositive = (quote.regularMarketChangePercent || 0) >= 0;
                return (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <div className="text-sm text-zinc-500">{quote.symbol?.replace('^', '')}</div>
                    <div className="text-4xl font-mono mt-3">{quote.regularMarketPrice?.toLocaleString('en-IN')}</div>
                    <div className={`mt-2 text-lg font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{quote.regularMarketChangePercent?.toFixed(2)}%
                    </div>
                  </div>
                );
              }) : <div className="col-span-3 text-center py-8 text-zinc-400">Loading live data...</div>}
            </div>

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
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-400">
                  Loading chart data...
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'screener' && <div className="text-center py-20 text-zinc-400">Screener coming soon</div>}
        {activeTab === 'ai' && <div className="text-center py-20 text-zinc-400">AI Advisor</div>}
      </main>
    </div>
  );
}

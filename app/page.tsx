'use client';

import { useState, useEffect } from 'react';

import type { MarketQuote } from '../types/market';

export default function N314() {
  const [activeTab, setActiveTab] = useState<'overview' | 'screener' | 'ai'>('overview');
  const [marketData, setMarketData] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = async () => {
    try {
      const res = await fetch('/api/market?type=indices');
      const json = await res.json();

      if (json.success && json.data) {
        setMarketData(json.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price?: number) => {
    if (!price) return '—';
    return price.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const formatChange = (change?: number, percent?: number) => {
    if (change === undefined || percent === undefined) return '';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
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
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('screener')}
              className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'screener' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}
            >
              Screener
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'ai' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}
            >
              AI Insights
            </button>
          </nav>

          <div className="text-xs px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            LIVE NSE
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && (
          <>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-5xl font-semibold tracking-tight">Market Overview</h2>
                <p className="text-zinc-400 mt-2">
                  {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading real-time data...'}
                </p>
              </div>
              <button
                onClick={fetchMarketData}
                disabled={loading}
                className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-xl disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {loading && marketData.length === 0 ? (
              <div className="text-center py-20 text-zinc-400">Loading live market data from Yahoo Finance...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {marketData.map((quote, index) => {
                  const isPositive = (quote.regularMarketChangePercent || 0) >= 0;
                  return (
                    <div
                      key={index}
                      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/30 transition-all"
                    >
                      <div className="text-sm text-zinc-500 tracking-widest">{quote.symbol.replace('^', '')}</div>
                      <div className="text-4xl font-mono font-semibold mt-3">
                        {formatPrice(quote.regularMarketPrice)}
                      </div>
                      <div className={`mt-4 text-lg font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatChange(quote.regularMarketChange, quote.regularMarketChangePercent)}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">{quote.shortName}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-center text-xs text-zinc-500 mt-8">
              Data provided by Yahoo Finance • Refreshes every 30 seconds
            </p>
          </>
        )}

        {activeTab === 'screener' && (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold mb-4">Stock Screener</h3>
            <p className="text-zinc-400">TanStack Table + advanced filters coming in next step</p>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold mb-4">AI Insights</h3>
            <p className="text-zinc-400">Gemini-powered analysis coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
}

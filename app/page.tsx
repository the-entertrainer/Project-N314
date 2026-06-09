'use client';

import { useState } from 'react';
import { Search, TrendingUp, BarChart3, Brain, Users } from 'lucide-react';
import MarketOverview from '../components/MarketOverview';
import StockScreener from '../components/StockScreener';
import AIAdvisor from '../components/AIAdvisor';
import Watchlist from '../components/Watchlist';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'screener' | 'advisor' | 'watchlist'>('overview');

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter">Nifty Intel</h1>
              <p className="text-xs text-zinc-500 -mt-1">Project N314 • Near-Accurate Market Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search NIFTY, RELIANCE, TCS..." 
                className="bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2.5 rounded-2xl text-sm w-full focus:outline-none focus:border-emerald-500 placeholder:text-zinc-500"
              />
            </div>
            <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-full flex items-center gap-1.5 font-medium">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              MARKET OPEN
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-6 border-t border-zinc-800">
          <nav className="flex text-sm font-medium">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'screener', label: 'Screener', icon: TrendingUp },
              { id: 'advisor', label: 'AI Insights', icon: Brain },
              { id: 'watchlist', label: 'Portfolio', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-8 py-4 border-b-2 transition-all hover:text-white ${activeTab === tab.id 
                    ? 'border-emerald-500 text-emerald-400' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && <MarketOverview />}
        {activeTab === 'screener' && <StockScreener />}
        {activeTab === 'advisor' && <AIAdvisor />}
        {activeTab === 'watchlist' && <Watchlist />}
      </main>

      <footer className="border-t border-zinc-800 py-8 mt-20 text-center text-xs text-zinc-500 bg-zinc-950">
        © Project N314 • Real-time data via Yahoo Finance & NSE proxies • AI powered by Gemini • 
        <span className="text-amber-400"> Not financial advice. Use at your own risk.</span>
      </footer>
    </div>
  );
}

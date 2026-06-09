'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Users } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'overview' | 'screener' | 'insights'>('overview');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xl">N</span>
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-tight">N314</div>
              <div className="text-xs text-zinc-500 -mt-1">STOCK INTEL</div>
            </div>
          </div>
          
          <nav className="flex gap-8 text-sm">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`pb-1 transition-colors ${activeTab === 'overview' ? 'border-b-2 border-emerald-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('screener')}
              className={`pb-1 transition-colors ${activeTab === 'screener' ? 'border-b-2 border-emerald-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Screener
            </button>
            <button 
              onClick={() => setActiveTab('insights')}
              className={`pb-1 transition-colors ${activeTab === 'insights' ? 'border-b-2 border-emerald-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              AI Insights
            </button>
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <div className="px-3 py-1.5 bg-zinc-800 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              MARKET OPEN
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div>
            <h1 className="text-4xl font-semibold mb-2">Market Overview</h1>
            <p className="text-zinc-400 mb-8">Real-time NSE data and insights</p>
            
            {/* Placeholder for Step 1 data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-zinc-400">NIFTY 50</div>
                    <div className="text-3xl font-mono mt-2">24,xxx</div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="text-emerald-500 mt-4 text-sm">+1.2% today</div>
              </div>
              {/* Similar cards for others */}
            </div>
            
            <div className="text-center text-zinc-500 py-12">
              Step 1 data fetching will go here (Yahoo Finance)
            </div>
          </div>
        )}
        
        {activeTab === 'screener' && (
          <div>
            <h1 className="text-4xl font-semibold mb-8">Stock Screener</h1>
            <div className="bg-zinc-900 rounded-2xl p-8 text-center text-zinc-400">
              TanStack Table coming in Step 2
            </div>
          </div>
        )}
        
        {activeTab === 'insights' && (
          <div>
            <h1 className="text-4xl font-semibold mb-8">AI Insights</h1>
            <div className="bg-zinc-900 rounded-2xl p-8 text-center text-zinc-400">
              Gemini integration in later step
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
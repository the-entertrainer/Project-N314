'use client';

import { useState } from 'react';
import { TrendingUp, BarChart3, Brain } from 'lucide-react';

export default function N314() {
  const [activeTab, setActiveTab] = useState<'overview' | 'screener' | 'ai'>('overview');

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
          <nav className="flex gap-2 text-sm">
            <button onClick={() => setActiveTab('overview')} className={`px-5 py-2 rounded-2xl transition ${activeTab === 'overview' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Overview</button>
            <button onClick={() => setActiveTab('screener')} className={`px-5 py-2 rounded-2xl transition ${activeTab === 'screener' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Screener</button>
            <button onClick={() => setActiveTab('ai')} className={`px-5 py-2 rounded-2xl transition ${activeTab === 'ai' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>AI Insights</button>
          </nav>
          <div className="text-xs px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">LIVE</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-5xl font-semibold tracking-tight mb-8">Market Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {['NIFTY 50', 'BANK NIFTY', 'SENSEX', 'NIFTY IT'].map((name, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                  <div className="text-sm text-zinc-500">{name}</div>
                  <div className="text-4xl font-mono mt-4">24,5{ i }6.78</div>
                  <div className="text-emerald-500 mt-2">+0.{i+2}4%</div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-zinc-500">Real-time data from Yahoo Finance (Step 1 ready)</p>
          </div>
        )}
        {activeTab === 'screener' && <div className="text-center py-20 text-zinc-400">Powerful TanStack Table Screener - Coming in next step</div>}
        {activeTab === 'ai' && <div className="text-center py-20 text-zinc-400">Gemini AI Advisor - Step 3</div>}
      </main>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { TrendingUp, BarChart3, Brain, User } from 'lucide-react';

export default function N314() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-black">N</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">N314</h1>
              <p className="text-xs text-zinc-500">Stock Intelligence</p>
            </div>
          </div>
          <nav className="flex gap-8 text-sm">
            <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
              <TrendingUp size={18} /> Overview
            </button>
            <button onClick={() => setActiveTab('screener')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeTab === 'screener' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
              <BarChart3 size={18} /> Screener
            </button>
            <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeTab === 'ai' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}>
              <Brain size={18} /> AI Advisor
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-xs px-3 py-1 bg-zinc-800 rounded-full text-emerald-400">Market Open</div>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm">
              <User size={18} /> Account
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-3xl font-semibold mb-8">Market Overview</h2>
            {/* Placeholder for indices and data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[ 'NIFTY 50', 'BANK NIFTY', 'SENSEX', 'MIDCAP' ].map((index, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                  <div className="text-zinc-400 text-sm">{index}</div>
                  <div className="text-4xl font-mono font-semibold mt-2">22,456.78</div>
                  <div className="text-emerald-500 flex items-center gap-1 mt-1 text-sm">+124.45 (+0.56%)</div>
                </div>
              ))}
            </div>
            <p className="text-zinc-500">Real data fetching coming in Step 1.</p>
          </div>
        )}

        {activeTab === 'screener' && <div className="text-zinc-400">Screener with TanStack Table - Next Step</div>}
        {activeTab === 'ai' && <div className="text-zinc-400">AI Advisor with Gemini - Step 3</div>}
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';

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
          <div>
            <h2 className="text-5xl font-semibold tracking-tight mb-8">Market Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {['NIFTY 50', 'BANK NIFTY', 'SENSEX', 'NIFTY IT'].map((name, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/40 transition-all">
                  <div className="text-sm text-zinc-500">{name}</div>
                  <div className="text-4xl font-mono mt-4">24,5{i}6.78</div>
                  <div className="text-emerald-500 mt-2 text-sm">+0.{i+2}4% today</div>
                </div>
              ))}
            </div>
            <p className="text-center text-zinc-500">Real-time data fetching (Yahoo Finance) coming in next step.</p>
          </div>
        )}
        {activeTab === 'screener' && <div className="text-center py-20 text-zinc-400 text-xl">Powerful Stock Screener with TanStack Table — Next</div>}
        {activeTab === 'ai' && <div className="text-center py-20 text-zinc-400 text-xl">Gemini-powered AI Advisor — Coming soon</div>}
      </main>

      <footer className="text-center text-xs text-zinc-500 py-8 border-t border-zinc-800">
        N314 • Not financial advice
      </footer>
    </div>
  );
}
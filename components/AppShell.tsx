'use client';

import { ReactNode } from 'react';
import { BarChart3, Bot, LayoutDashboard, Search, Wallet } from 'lucide-react';
import ThreeDOrb from './ThreeDOrb';

export type AppTab = 'overview' | 'screener' | 'ai' | 'portfolio';

const TABS: { id: AppTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'screener', label: 'Screener', icon: Search },
  { id: 'ai', label: 'AI Advisor', icon: Bot },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet },
];

interface AppShellProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: ReactNode;
}

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:shrink-0 lg:sticky lg:top-0 lg:h-dvh border-r border-white/10 bg-zinc-950/60 backdrop-blur-xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ThreeDOrb size="md" />
            <div>
              <div className="text-xl font-semibold tracking-tight">N314</div>
              <div className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase">Stock Intelligence</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium border transition-all ${
                activeTab === id ? 'nav-item-active' : 'nav-item-inactive'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="glass-card px-4 py-3 flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 font-medium">Live Market Data</span>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile / tablet header */}
        <header className="lg:hidden sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl safe-area-top">
          <div className="px-4 sm:px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ThreeDOrb size="sm" />
              <div>
                <div className="text-lg font-semibold tracking-tight leading-none">N314</div>
                <div className="text-[9px] text-zinc-500 tracking-widest uppercase">Stock Intelligence</div>
              </div>
            </div>
            <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              LIVE
            </div>
          </div>

          <div className="px-3 pb-3">
            <div className="flex bg-zinc-900/80 rounded-2xl p-1 border border-white/10 overflow-x-auto no-scrollbar">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={`flex-1 min-w-[72px] px-2 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                    activeTab === id ? 'tab-pill-active' : 'tab-pill-inactive'
                  }`}
                >
                  {id === 'ai' ? 'AI' : label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-white/10 bg-zinc-950/40">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight capitalize">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {activeTab === 'overview' && 'Real-time insights across major Indian indices'}
              {activeTab === 'screener' && 'Find and track market opportunities'}
              {activeTab === 'ai' && 'Powered by Google Gemini 2.0 Flash'}
              {activeTab === 'portfolio' && 'Track holdings and performance'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            NSE · BSE
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-5 lg:px-8 py-5 lg:py-8 pb-24 lg:pb-8 max-w-app mx-auto w-full">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl safe-area-bottom">
          <div className="grid grid-cols-4 px-2 py-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  activeTab === id ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">
                  {id === 'ai' ? 'AI' : label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
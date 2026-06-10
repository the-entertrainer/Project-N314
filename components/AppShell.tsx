'use client';

import { ReactNode } from 'react';
import { Bot, LayoutDashboard, Search, Wallet } from 'lucide-react';
import ThreeDOrb from './ThreeDOrb';

export type AppTab = 'overview' | 'screener' | 'ai' | 'portfolio';

const TABS: { id: AppTab; label: string; shortLabel: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { id: 'screener', label: 'Screener', shortLabel: 'Screener', icon: Search },
  { id: 'ai', label: 'Intelligence', shortLabel: 'AI', icon: Bot },
  { id: 'portfolio', label: 'Portfolio', shortLabel: 'Portfolio', icon: Wallet },
];

interface AppShellProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: ReactNode;
}

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const activeMeta = TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl safe-area-top">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between max-w-app mx-auto w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <ThreeDOrb size="sm" />
            <div className="min-w-0">
              <div className="text-lg font-semibold tracking-tight leading-none">N314</div>
              <div className="text-[9px] text-zinc-500 tracking-widest uppercase truncate">
                {activeMeta?.label ?? 'Stock Intelligence'}
              </div>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-5 pb-24 max-w-app mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl safe-area-bottom">
        <div className="grid grid-cols-4 px-2 py-2 max-w-app mx-auto">
          {TABS.map(({ id, shortLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                activeTab === id ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{shortLabel}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
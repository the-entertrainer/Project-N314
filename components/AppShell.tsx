'use client';

import { ReactNode } from 'react';
import { Bot, LayoutDashboard, Search, Wallet, Zap } from 'lucide-react';
import ThreeDOrb from './ThreeDOrb';
import type { AppTab } from '../store/navigationStore';

const TABS: { id: AppTab; label: string; shortLabel: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'screener', label: 'Screener', shortLabel: 'Scan', icon: Search },
  { id: 'ai', label: 'Intelligence', shortLabel: 'AI', icon: Bot },
  { id: 'portfolio', label: 'Portfolio', shortLabel: 'Port', icon: Wallet },
  { id: 'powerapps', label: 'Power Apps', shortLabel: 'Power', icon: Zap },
];

interface AppShellProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: ReactNode;
}

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const activeMeta = TABS.find((t) => t.id === activeTab);

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden flex flex-col h-[100dvh]">
      <header className="shrink-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl safe-area-top">
        <div className="px-4 py-3 flex items-center justify-between w-full max-w-[100vw]">
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

      <main className="flex-1 min-h-0 w-full max-w-[100vw] overflow-x-hidden overflow-y-hidden px-4 py-3 pb-[4.5rem]">
        <div className="w-full max-w-[100vw] mx-auto h-full overflow-y-auto no-scrollbar">
          {children}
        </div>
      </main>

      <nav className="shrink-0 fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-zinc-950/95 backdrop-blur-xl safe-area-bottom w-full max-w-[100vw]">
        <div className="grid grid-cols-5 px-1 py-1.5 w-full max-w-[100vw]">
          {TABS.map(({ id, shortLabel, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all min-w-0 ${
                activeTab === id ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-[9px] font-medium truncate w-full text-center px-0.5">
                {shortLabel}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export type { AppTab };
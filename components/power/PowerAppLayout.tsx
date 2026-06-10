'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { useNavigationStore } from '../../store/navigationStore';
import { getPowerAppByPath } from '../../lib/powerRoutes';

interface PowerAppLayoutProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  path: string;
  settings: ReactNode;
  children: ReactNode;
}

export default function PowerAppLayout({
  title,
  subtitle,
  icon: Icon,
  path,
  settings,
  children,
}: PowerAppLayoutProps) {
  const router = useRouter();
  const setLastPowerAppPath = useNavigationStore((s) => s.setLastPowerAppPath);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);
  const setActivePowerPanel = useNavigationStore((s) => s.setActivePowerPanel);

  useEffect(() => {
    setLastPowerAppPath(path);
    setActiveTab('powerapps');
    const app = getPowerAppByPath(path);
    if (app) setActivePowerPanel(app.id);
  }, [path, setLastPowerAppPath, setActiveTab, setActivePowerPanel]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden w-full max-w-[100vw]">
      <div className="shrink-0 flex items-center gap-3 mb-4">
        <button
          onClick={() => router.push('/power-apps')}
          className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors shrink-0"
          aria-label="Back to launcher"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className={`p-2.5 rounded-xl bg-emerald-500/10 shrink-0`}>
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate">{title}</h1>
          <p className="text-[10px] text-zinc-500 truncate">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
        <div className="shrink-0 glass-card p-4 overflow-x-hidden">{settings}</div>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4">{children}</div>
      </div>
    </div>
  );
}
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { POWER_APPS } from '../../lib/powerRoutes';
import { useNavigationStore } from '../../store/navigationStore';

export default function PowerLauncher() {
  const router = useRouter();
  const setLastPowerAppPath = useNavigationStore((s) => s.setLastPowerAppPath);
  const setActiveTab = useNavigationStore((s) => s.setActiveTab);

  useEffect(() => {
    setLastPowerAppPath('/power-apps');
    setActiveTab('powerapps');
  }, [setLastPowerAppPath, setActiveTab]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden w-full max-w-[100vw]">
      <div className="shrink-0 mb-6">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-emerald-400" />
          Power Apps
        </h2>
        <p className="text-zinc-400 text-sm mt-1">Advanced market analysis tools</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {POWER_APPS.map(({ path, title, subtitle, description, icon: Icon, gradient }) => (
            <button
              key={path}
              type="button"
              onClick={() => router.push(path)}
              className={`group glass-card p-4 text-left hover:ring-2 hover:ring-emerald-500/30 transition-all active:scale-[0.98] bg-gradient-to-br ${gradient} min-h-[120px] flex flex-col`}
            >
              <div className="p-2.5 rounded-2xl bg-zinc-950/50 w-fit mb-3 group-hover:bg-emerald-500/10 transition-colors">
                <Icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="font-semibold text-sm leading-tight">{title}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{subtitle}</div>
              <div className="text-[10px] text-zinc-600 mt-2 line-clamp-2 hidden sm:block">{description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
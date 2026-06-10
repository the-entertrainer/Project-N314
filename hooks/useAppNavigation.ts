'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  useNavigationStore,
  VALID_TABS,
  VALID_PANELS,
  type AppTab,
} from '../store/navigationStore';
import type { PowerPanelId } from '../types/powerApps';

export function useAppNavigation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = useNavigationStore((s) => s.activeTab);
  const activePowerPanel = useNavigationStore((s) => s.activePowerPanel);
  const setActiveTabStore = useNavigationStore((s) => s.setActiveTab);
  const setActivePowerPanelStore = useNavigationStore((s) => s.setActivePowerPanel);

  useEffect(() => {
    const tab = searchParams.get('tab') as AppTab | null;
    const panel = searchParams.get('panel') as PowerPanelId | null;
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTabStore(tab);
      if (panel && VALID_PANELS.includes(panel)) setActivePowerPanelStore(panel);
    } else {
      const stored = useNavigationStore.getState();
      const params = new URLSearchParams();
      params.set('tab', stored.activeTab);
      if (stored.activeTab === 'powerapps') params.set('panel', stored.activePowerPanel);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushUrl = useCallback(
    (tab: AppTab, panel?: PowerPanelId) => {
      const params = new URLSearchParams();
      params.set('tab', tab);
      if (tab === 'powerapps') {
        params.set('panel', panel ?? activePowerPanel);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, activePowerPanel]
  );

  const setActiveTab = useCallback(
    (tab: AppTab) => {
      setActiveTabStore(tab);
      pushUrl(tab);
    },
    [setActiveTabStore, pushUrl]
  );

  const setActivePowerPanel = useCallback(
    (panel: PowerPanelId) => {
      setActivePowerPanelStore(panel);
      setActiveTabStore('powerapps');
      pushUrl('powerapps', panel);
    },
    [setActivePowerPanelStore, setActiveTabStore, pushUrl]
  );

  return { activeTab, activePowerPanel, setActiveTab, setActivePowerPanel };
}
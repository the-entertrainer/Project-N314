'use client';

import { useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useNavigationStore, VALID_TABS, type AppTab } from '../store/navigationStore';

export function useShellNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setActiveTabStore = useNavigationStore((s) => s.setActiveTab);
  const setLastPowerAppPath = useNavigationStore((s) => s.setLastPowerAppPath);
  const lastPowerAppPath = useNavigationStore((s) => s.lastPowerAppPath);
  const storeTab = useNavigationStore((s) => s.activeTab);

  const isPowerRoute = pathname.startsWith('/power-apps');
  const activeTab: AppTab = isPowerRoute ? 'powerapps' : storeTab;

  useEffect(() => {
    if (isPowerRoute) {
      setLastPowerAppPath(pathname);
      setActiveTabStore('powerapps');
    } else {
      const tab = searchParams.get('tab') as AppTab | null;
      if (tab && VALID_TABS.includes(tab) && tab !== 'powerapps') {
        setActiveTabStore(tab);
      }
    }
  }, [pathname, isPowerRoute, searchParams, setActiveTabStore, setLastPowerAppPath]);

  const setActiveTab = useCallback(
    (tab: AppTab) => {
      setActiveTabStore(tab);
      if (tab === 'powerapps') {
        router.push(lastPowerAppPath || '/power-apps');
      } else {
        router.push(`/?tab=${tab}`);
      }
    },
    [router, setActiveTabStore, lastPowerAppPath]
  );

  return { activeTab, setActiveTab, isPowerRoute };
}
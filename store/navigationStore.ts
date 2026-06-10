import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PowerPanelId } from '../types/powerApps';

export type AppTab = 'overview' | 'screener' | 'ai' | 'portfolio' | 'powerapps';

interface NavigationState {
  activeTab: AppTab;
  activePowerPanel: PowerPanelId;
  setActiveTab: (tab: AppTab) => void;
  setActivePowerPanel: (panel: PowerPanelId) => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      activeTab: 'overview',
      activePowerPanel: 'nifty',
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActivePowerPanel: (panel) => set({ activePowerPanel: panel }),
    }),
    { name: 'n314-navigation' }
  )
);

export const VALID_TABS: AppTab[] = ['overview', 'screener', 'ai', 'portfolio', 'powerapps'];
export const VALID_PANELS: PowerPanelId[] = ['nifty', 'fiidii', 'fno', 'equity', 'ipo'];
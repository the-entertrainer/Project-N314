import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NiftyLookback = 10 | 20 | 30;
export type StrategyMode = 'conservative' | 'aggressive';
export type FiiSessions = 1 | 5 | 10;
export type FnoSort = 'volume' | 'oi_change' | 'price_delta';
export type EquityTimeline = '1-3' | '5+';
export type IpoFilter = 'upcoming' | 'recent';
export type IpoCategory = 'retail' | 'hni';

interface PowerSettingsState {
  niftyLookback: NiftyLookback;
  strategyMode: StrategyMode;
  fiiSessions: FiiSessions;
  fnoSort: FnoSort;
  targetRiskReward: number;
  equitySector: string;
  equityTimeline: EquityTimeline;
  equitySymbol: string;
  ipoFilter: IpoFilter;
  ipoCategory: IpoCategory;
  ipoBudget: string;
  setNiftyLookback: (v: NiftyLookback) => void;
  setStrategyMode: (v: StrategyMode) => void;
  setFiiSessions: (v: FiiSessions) => void;
  setFnoSort: (v: FnoSort) => void;
  setTargetRiskReward: (v: number) => void;
  setEquitySector: (v: string) => void;
  setEquityTimeline: (v: EquityTimeline) => void;
  setEquitySymbol: (v: string) => void;
  setIpoFilter: (v: IpoFilter) => void;
  setIpoCategory: (v: IpoCategory) => void;
  setIpoBudget: (v: string) => void;
}

export const usePowerSettingsStore = create<PowerSettingsState>()(
  persist(
    (set) => ({
      niftyLookback: 20,
      strategyMode: 'conservative',
      fiiSessions: 5,
      fnoSort: 'volume',
      targetRiskReward: 2,
      equitySector: 'Information Technology',
      equityTimeline: '1-3',
      equitySymbol: 'RELIANCE.NS',
      ipoFilter: 'upcoming',
      ipoCategory: 'retail',
      ipoBudget: '200000',
      setNiftyLookback: (v) => set({ niftyLookback: v }),
      setStrategyMode: (v) => set({ strategyMode: v }),
      setFiiSessions: (v) => set({ fiiSessions: v }),
      setFnoSort: (v) => set({ fnoSort: v }),
      setTargetRiskReward: (v) => set({ targetRiskReward: v }),
      setEquitySector: (v) => set({ equitySector: v }),
      setEquityTimeline: (v) => set({ equityTimeline: v }),
      setEquitySymbol: (v) => set({ equitySymbol: v }),
      setIpoFilter: (v) => set({ ipoFilter: v }),
      setIpoCategory: (v) => set({ ipoCategory: v }),
      setIpoBudget: (v) => set({ ipoBudget: v }),
    }),
    { name: 'n314-power-settings' }
  )
);

export const EQUITY_SECTORS = [
  'Information Technology',
  'Financial Services',
  'Automobile and Auto Components',
  'Healthcare',
  'Fast Moving Consumer Goods',
  'Oil Gas & Consumable Fuels',
  'Metals & Mining',
  'Telecommunication',
  'Realty',
  'Power',
];
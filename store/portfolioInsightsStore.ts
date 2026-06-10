import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PortfolioHolding } from './portfolioStore';
import type { PortfolioInsight } from '../types/portfolio';

interface PortfolioInsightsState {
  insight: PortfolioInsight | null;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
  holdingsKey: string | null;
  fetchInsights: (
    holdings: PortfolioHolding[],
    metrics: {
      portfolioValue: number;
      totalInvested: number;
      totalGainLoss: number;
      totalGainLossPercent: number;
      prices: Record<string, number>;
      changes: Record<string, number>;
    }
  ) => Promise<void>;
  clearInsights: () => void;
}

function holdingsKey(holdings: PortfolioHolding[]) {
  return holdings
    .map((h) => `${h.symbol}:${h.quantity}:${h.avgPrice}`)
    .sort()
    .join('|');
}

export const usePortfolioInsightsStore = create<PortfolioInsightsState>()(
  persist(
    (set) => ({
      insight: null,
      loading: false,
      error: null,
      lastFetched: null,
      holdingsKey: null,

      fetchInsights: async (holdings, metrics) => {
        if (holdings.length === 0) {
          set({ insight: null, error: null, holdingsKey: null });
          return;
        }

        const key = holdingsKey(holdings);
        set({ loading: true, error: null });

        try {
          const payload = holdings.map((h) => ({
            symbol: h.symbol,
            quantity: h.quantity,
            avgPrice: h.avgPrice,
            currentPrice: metrics.prices[h.symbol] ?? h.avgPrice,
            changePercent: metrics.changes[h.symbol],
          }));

          const res = await fetch('/api/portfolio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              holdings: payload,
              portfolioValue: metrics.portfolioValue,
              totalInvested: metrics.totalInvested,
              totalGainLoss: metrics.totalGainLoss,
              totalGainLossPercent: metrics.totalGainLossPercent,
            }),
          });

          const json = await res.json();

          if (!res.ok || !json.success) {
            set({
              loading: false,
              error: json.error || 'Portfolio intelligence unavailable',
            });
            return;
          }

          set({
            insight: json.insight,
            loading: false,
            error: null,
            lastFetched: new Date().toISOString(),
            holdingsKey: key,
          });
        } catch {
          set({
            loading: false,
            error: 'Failed to connect to portfolio intelligence',
          });
        }
      },

      clearInsights: () =>
        set({ insight: null, error: null, lastFetched: null, holdingsKey: null }),
    }),
    {
      name: 'n314-portfolio-insights',
      partialize: (state) => ({
        insight: state.insight,
        lastFetched: state.lastFetched,
        holdingsKey: state.holdingsKey,
      }),
    }
  )
);

export { holdingsKey };
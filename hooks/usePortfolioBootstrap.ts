'use client';

import { useEffect, useRef, useState } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { usePortfolioInsightsStore } from '../store/portfolioInsightsStore';

interface MarketQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
}

export function usePortfolioBootstrap() {
  const holdings = usePortfolioStore((s) => s.holdings);
  const fetchInsights = usePortfolioInsightsStore((s) => s.fetchInsights);
  const [hydrated, setHydrated] = useState(false);
  const bootstrapped = useRef(false);

  useEffect(() => {
    const onReady = () => setHydrated(true);
    const unsub = usePortfolioStore.persist.onFinishHydration(onReady);
    if (usePortfolioStore.persist.hasHydrated()) onReady();
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated || bootstrapped.current || holdings.length === 0) return;
    bootstrapped.current = true;

    let cancelled = false;

    async function bootstrap() {
      const symbols = holdings.map((h) => h.symbol).join(',');
      const prices: Record<string, number> = {};
      const changes: Record<string, number> = {};

      try {
        const res = await fetch(`/api/market?symbols=${encodeURIComponent(symbols)}`);
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          json.data.forEach((q: MarketQuote) => {
            if (q.symbol && q.regularMarketPrice) prices[q.symbol] = q.regularMarketPrice;
            if (q.symbol && q.regularMarketChangePercent != null) {
              changes[q.symbol] = q.regularMarketChangePercent;
            }
          });
        }
      } catch {
        /* use avg prices as fallback */
      }

      if (cancelled) return;

      const portfolioValue = holdings.reduce((sum, h) => {
        const p = prices[h.symbol] ?? h.avgPrice;
        return sum + h.quantity * p;
      }, 0);
      const totalInvested = holdings.reduce((sum, h) => sum + h.quantity * h.avgPrice, 0);
      const totalGainLoss = portfolioValue - totalInvested;
      const totalGainLossPercent =
        totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

      await fetchInsights(holdings, {
        portfolioValue,
        totalInvested,
        totalGainLoss,
        totalGainLossPercent,
        prices,
        changes,
      });
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [hydrated, holdings, fetchInsights]);
}
import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../services/yahooService';
import { enrichWithIndicators } from '../utils/technical';
import type { HistoricalBar } from '../types';

export function useStockHistory(ticker: string | null) {
  return useQuery({
    queryKey: ['history', ticker],
    queryFn: async () => {
      if (!ticker) return { bars: [] as HistoricalBar[], indicators: null };
      const bars = await fetchHistory(ticker, '1y', '1d');
      const indicators = bars.length >= 15 ? enrichWithIndicators(bars) : null;
      return { bars, indicators };
    },
    enabled: !!ticker,
    staleTime: 15 * 60_000,
    retry: 2,
  });
}

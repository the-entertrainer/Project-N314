import { useQuery } from '@tanstack/react-query';
import { useStockStore } from '@/store/stockStore';
import YahooService from '@/services/yahooService';
import ScoringEngine from '@/utils/scoringEngine';
import NIFTY500 from '@/data/nifty500';
import type { Stock } from '@/types';

const BATCH_SIZE = 250;

export function useStocksData() {
  const store = useStockStore();

  return useQuery({
    queryKey: ['stocks'],
    queryFn: async () => {
      store.setFetchStatus('loading');
      store.setError(null);

      try {
        const tickers = NIFTY500.map((s: any) => s.ticker);

        // Pre-populate with static data
        const allStocks = new Map<string, Stock>();
        for (const s of NIFTY500) {
          allStocks.set(s.ticker, {
            ...s,
            score: 0,
            grade: 'C',
          });
        }
        store.setStocks([...allStocks.values()]);

        // Fetch in batches
        const batches: string[][] = [];
        for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
          batches.push(tickers.slice(i, i + BATCH_SIZE));
        }

        for (const batch of batches) {
          try {
            const quotes = await YahooService.fetchQuoteBatch(batch);
            const updated: Stock[] = [];

            for (const q of quotes) {
              const stock = allStocks.get(q.symbol);
              if (stock) {
                Object.assign(stock, {
                  ticker: q.symbol,
                  cmp: q.regularMarketPrice,
                  returnDaily: q.regularMarketChangePercent,
                  high52w: q.fiftyTwoWeekHigh,
                  low52w: q.fiftyTwoWeekLow,
                  marketCap: q.marketCap,
                  pe: q.trailingPE,
                  pb: q.priceToBook,
                  eps: q.trailingEps,
                  divYield: q.trailingAnnualDividendYield
                    ? q.trailingAnnualDividendYield * 100
                    : null,
                  beta: q.beta,
                  volume: q.regularMarketVolume,
                  avgVolume: q.averageVolume,
                  volumeVsAvg:
                    q.averageVolume > 0
                      ? q.regularMarketVolume / q.averageVolume
                      : 1,
                });
                updated.push(stock);
              }
            }

            store.patchStocks(updated);
          } catch (e) {
            console.warn('Batch fetch failed:', e);
          }
        }

        // Score all stocks
        const scoreMap = ScoringEngine.scoreAll(store.stocks);
        ScoringEngine.applyScoresToState(store.stocks, scoreMap);
        store.patchStocks([...store.stocks.values()]);

        store.setFetchStatus('done');
        return [...store.stocks.values()];
      } catch (e) {
        const error =
          e instanceof Error ? e.message : 'Unknown error during fetch';
        store.setError(error);
        store.setFetchStatus('done');
        throw e;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    enabled: store.isStaleFetch(),
  });
}

export function useStockList() {
  const filteredStocks = useStockStore((state) => state.filteredStocks);
  return filteredStocks;
}

export function useStockById(ticker: string) {
  const stock = useStockStore((state) => state.stocks.get(ticker));
  return stock;
}

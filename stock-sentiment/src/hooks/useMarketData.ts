import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { fetchNifty500Universe, fetchFiiDii, type UniverseEntry } from '../services/nseService';
import { fetchAllQuotesInChunks, fetchIndexQuotes } from '../services/yahooService';
import { fetchMarketNews } from '../services/newsService';
import { enrichQuote } from '../utils/scoring';
import type { IndexQuote } from '../types';

const INDEX_SYMBOLS = ['^NSEI', '^NSEBANK', '^BSESN', '^GSPC', '^DJI', '^IXIC', '^HSI'];
const INDEX_NAMES: Record<string, string> = {
  '^NSEI':   'NIFTY 50',
  '^NSEBANK':'BANK NIFTY',
  '^BSESN':  'SENSEX',
  '^GSPC':   'S&P 500',
  '^DJI':    'DOW JONES',
  '^IXIC':   'NASDAQ',
  '^HSI':    'HANG SENG',
};

export function useMarketData() {
  const setSourceStatus = useAppStore((s) => s.setSourceStatus);
  const setUniverse     = useAppStore((s) => s.setUniverse);
  const patchQuotes     = useAppStore((s) => s.patchQuotes);
  const setIndices      = useAppStore((s) => s.setIndices);
  const setFiiDii       = useAppStore((s) => s.setFiiDii);
  const setNews         = useAppStore((s) => s.setNews);

  const priceFetchRef = useRef(false);

  // 1. Universe (NSE live)
  const { data: universe } = useQuery<UniverseEntry[]>({
    queryKey: ['universe'],
    queryFn: async () => {
      setSourceStatus('universe', { status: 'fetching' });
      try {
        const u = await fetchNifty500Universe();
        setUniverse(u);
        setSourceStatus('universe', { status: 'done', total: u.length, lastUpdated: Date.now() });
        return u;
      } catch {
        setSourceStatus('universe', { status: 'failed', error: 'NSE fetch failed' });
        return [];
      }
    },
    staleTime: 6 * 60 * 60_000,
    retry: 2,
  });

  // 2. Prices — chunked, triggered after universe loads
  useEffect(() => {
    if (!universe?.length || priceFetchRef.current) return;
    priceFetchRef.current = true;

    const nameMap = new Map<string, { name: string; sector: string; isFno: boolean }>(
      universe.map((u) => [u.ticker, { name: u.name, sector: u.sector, isFno: u.isFno }])
    );
    const tickers = universe.map((u) => u.ticker);
    const total   = tickers.length;

    setSourceStatus('prices', { status: 'fetching', loaded: 0, total });

    fetchAllQuotesInChunks(tickers, nameMap, (chunk, loaded) => {
      const enriched = chunk.map(enrichQuote);
      patchQuotes(enriched);
      setSourceStatus('prices', {
        status:      loaded < total ? 'partial' : 'done',
        loaded,
        total,
        lastUpdated: Date.now(),
      });
    }).catch(() => {
      setSourceStatus('prices', { status: 'failed', error: 'Price fetch failed' });
    });
  }, [universe?.length]);

  // 3. Indices (refresh every 5 min)
  useQuery({
    queryKey: ['indices'],
    queryFn: async () => {
      setSourceStatus('indices', { status: 'fetching' });
      try {
        const data    = await fetchIndexQuotes(INDEX_SYMBOLS);
        const results = data?.quoteResponse?.result ?? [];
        const indices: IndexQuote[] = results.map((r: any) => ({
          symbol:    r.symbol,
          name:      INDEX_NAMES[r.symbol] ?? r.shortName ?? r.symbol,
          price:     r.regularMarketPrice ?? 0,
          change:    r.regularMarketChange ?? 0,
          changePct: r.regularMarketChangePercent ?? 0,
          high:      r.regularMarketDayHigh ?? 0,
          low:       r.regularMarketDayLow ?? 0,
        }));
        setIndices(indices);
        setSourceStatus('indices', { status: 'done', lastUpdated: Date.now() });
        return indices;
      } catch {
        setSourceStatus('indices', { status: 'failed' });
        return [];
      }
    },
    staleTime:      5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  });

  // 4. FII/DII
  useQuery({
    queryKey: ['fiidii'],
    queryFn: async () => {
      setSourceStatus('fiiDii', { status: 'fetching' });
      try {
        const flow = await fetchFiiDii();
        if (flow) {
          setFiiDii(flow);
          setSourceStatus('fiiDii', { status: 'done', lastUpdated: Date.now() });
        } else {
          setSourceStatus('fiiDii', { status: 'failed' });
        }
        return flow;
      } catch {
        setSourceStatus('fiiDii', { status: 'failed' });
        return null;
      }
    },
    staleTime: 30 * 60_000,
    retry: 1,
  });

  // 5. Market news
  useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      setSourceStatus('news', { status: 'fetching' });
      try {
        const articles = await fetchMarketNews('India stock market NSE BSE Nifty', 20);
        setNews(articles);
        setSourceStatus('news', {
          status:      articles.length > 0 ? 'done' : 'failed',
          total:       articles.length,
          lastUpdated: Date.now(),
        });
        return articles;
      } catch {
        setSourceStatus('news', { status: 'failed', error: 'News fetch failed' });
        return [];
      }
    },
    staleTime: 30 * 60_000,
    retry: 1,
  });
}

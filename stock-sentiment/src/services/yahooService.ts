import type { StockQuote, HistoricalBar } from '../types';

const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
];

const CHUNK_SIZE = 50;
const TIMEOUT_MS = 8000;

async function fetchWithProxy(url: string): Promise<any> {
  for (const proxy of PROXIES) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const res = await fetch(proxy(url), {
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // try next proxy
    }
  }
  throw new Error(`All proxies failed for: ${url}`);
}

export async function fetchQuoteChunk(
  tickers: string[],
  nameMap: Map<string, { name: string; sector: string; isFno: boolean }>,
): Promise<StockQuote[]> {
  const symbols = tickers.map((t) => `${t}.NS`).join(',');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange,fiftyTwoWeekHigh,fiftyTwoWeekLow,marketCap,trailingPE,priceToBook,trailingEps,trailingAnnualDividendYield,beta,regularMarketVolume,averageVolume,shortName`;

  const data = await fetchWithProxy(url);
  const quotes: any[] = data?.quoteResponse?.result ?? [];

  return quotes
    .filter((q) => q.regularMarketPrice != null)
    .map((q) => {
      const ticker = q.symbol.replace('.NS', '');
      const meta = nameMap.get(ticker) ?? { name: ticker, sector: 'Unknown', isFno: false };
      const vol = q.regularMarketVolume ?? 0;
      const avg = q.averageVolume ?? 1;
      return {
        symbol: q.symbol,
        ticker,
        name: meta.name || q.shortName || ticker,
        sector: meta.sector,
        isFno: meta.isFno,
        price: q.regularMarketPrice,
        change: q.regularMarketChange ?? 0,
        changePct: q.regularMarketChangePercent ?? 0,
        high52w: q.fiftyTwoWeekHigh ?? 0,
        low52w: q.fiftyTwoWeekLow ?? 0,
        marketCap: q.marketCap ?? 0,
        volume: vol,
        avgVolume: avg,
        volumeRatio: avg > 0 ? vol / avg : 1,
        pe: q.trailingPE ?? null,
        pb: q.priceToBook ?? null,
        eps: q.trailingEps ?? null,
        divYield: q.trailingAnnualDividendYield ? q.trailingAnnualDividendYield * 100 : null,
        beta: q.beta ?? null,
      } satisfies StockQuote;
    });
}

export async function fetchAllQuotesInChunks(
  tickers: string[],
  nameMap: Map<string, { name: string; sector: string; isFno: boolean }>,
  onChunk: (chunk: StockQuote[], loaded: number, total: number) => void,
): Promise<void> {
  const chunks: string[][] = [];
  for (let i = 0; i < tickers.length; i += CHUNK_SIZE) {
    chunks.push(tickers.slice(i, i + CHUNK_SIZE));
  }

  let loaded = 0;
  for (const chunk of chunks) {
    try {
      const quotes = await fetchQuoteChunk(chunk, nameMap);
      loaded += chunk.length;
      onChunk(quotes, loaded, tickers.length);
    } catch {
      loaded += chunk.length; // still advance counter on failure
      onChunk([], loaded, tickers.length);
    }
  }
}

export async function fetchHistory(ticker: string, range = '1y', interval = '1d'): Promise<HistoricalBar[]> {
  const symbol = ticker.includes('.NS') ? ticker : `${ticker}.NS`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
  const data = await fetchWithProxy(url);
  const result = data?.chart?.result?.[0];
  if (!result) return [];

  const ts: number[] = result.timestamp ?? [];
  const o: number[] = result.indicators?.quote?.[0]?.open ?? [];
  const h: number[] = result.indicators?.quote?.[0]?.high ?? [];
  const l: number[] = result.indicators?.quote?.[0]?.low ?? [];
  const c: number[] = result.indicators?.quote?.[0]?.close ?? [];
  const v: number[] = result.indicators?.quote?.[0]?.volume ?? [];

  return ts
    .map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      open: o[i] ?? 0,
      high: h[i] ?? 0,
      low: l[i] ?? 0,
      close: c[i] ?? 0,
      volume: v[i] ?? 0,
    }))
    .filter((b) => b.close > 0);
}

export async function fetchIndexQuotes(symbols: string[]) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange,regularMarketDayHigh,regularMarketDayLow,shortName`;
  return fetchWithProxy(url);
}

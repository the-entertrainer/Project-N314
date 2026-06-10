const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

interface ChartMeta {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  regularMarketVolume?: number;
  currency?: string;
  exchangeName?: string;
}

interface ChartQuote {
  open?: (number | null)[];
  high?: (number | null)[];
  low?: (number | null)[];
  close?: (number | null)[];
  volume?: (number | null)[];
}

export interface HistoricalBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  shortName?: string;
  regularMarketPrice: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  currency?: string;
}

export async function fetchChart(symbol: string, range = '3mo') {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=${range}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Chart API error for ${symbol}: HTTP ${res.status}`);
  }

  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${symbol}`);

  return result as {
    meta: ChartMeta;
    timestamp?: number[];
    indicators?: { quote?: ChartQuote[] };
  };
}

export function metaToQuote(meta: ChartMeta): StockQuote {
  const price = meta.regularMarketPrice ?? 0;
  const previous = meta.chartPreviousClose;
  const changePercent =
    price && previous ? ((price - previous) / previous) * 100 : undefined;

  return {
    symbol: meta.symbol || '',
    shortName: meta.shortName || meta.longName,
    regularMarketPrice: price,
    regularMarketChangePercent: changePercent,
    regularMarketVolume: meta.regularMarketVolume,
    currency: meta.currency,
  };
}

export function extractHistoricalBars(result: Awaited<ReturnType<typeof fetchChart>>): HistoricalBar[] {
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};

  return timestamps
    .map((time, i) => ({
      date: new Date(time * 1000).toISOString().split('T')[0],
      open: quotes.open?.[i] ?? 0,
      high: quotes.high?.[i] ?? 0,
      low: quotes.low?.[i] ?? 0,
      close: quotes.close?.[i] ?? 0,
      volume: quotes.volume?.[i] ?? 0,
    }))
    .filter((bar) => bar.close > 0);
}

export async function fetchStockBundle(symbol: string) {
  const chart = await fetchChart(symbol, '3mo');
  const quote = metaToQuote(chart.meta);
  const history = extractHistoricalBars(chart);
  return { quote, history, meta: chart.meta };
}

export const GLOBAL_INDICES = ['^GSPC', '^DJI', '^IXIC', '^NSEI', '^NSEBANK'];
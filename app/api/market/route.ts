import { NextRequest, NextResponse } from 'next/server';

interface HistoricalDataPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

interface ChartMeta {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  regularMarketVolume?: number;
}

interface ChartQuote {
  open?: number[];
  high?: number[];
  low?: number[];
  close?: number[];
  volume?: number[];
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const INDEX_SYMBOLS = ['^NSEI', '^NSEBANK', '^BSESN'];
const POPULAR_SYMBOLS = [
  'RELIANCE.NS',
  'TCS.NS',
  'HDFCBANK.NS',
  'INFY.NS',
  'ICICIBANK.NS',
  'SBIN.NS',
  'BAJFINANCE.NS',
  'HINDUNILVR.NS',
  'ITC.NS',
  'LT.NS',
];

async function fetchChart(symbol: string, range = '5d', interval = '1d') {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=${interval}&range=${range}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    next: interval === '1d' ? { revalidate: 25 } : undefined,
    cache: interval !== '1d' ? 'no-store' : undefined,
  });

  if (!res.ok) {
    throw new Error(`Yahoo chart API error for ${symbol}: HTTP ${res.status}`);
  }

  const data = await res.json();
  const result = data.chart?.result?.[0];

  if (!result) {
    throw new Error(`No chart data for ${symbol}`);
  }

  return result as {
    meta: ChartMeta;
    timestamp?: number[];
    indicators?: { quote?: ChartQuote[] };
  };
}

function metaToQuote(meta: ChartMeta) {
  const price = meta.regularMarketPrice;
  const previous = meta.chartPreviousClose;
  const changePercent =
    price !== undefined && previous
      ? ((price - previous) / previous) * 100
      : undefined;

  return {
    symbol: meta.symbol || '',
    shortName: meta.shortName || meta.longName,
    regularMarketPrice: price,
    regularMarketChangePercent: changePercent,
    regularMarketVolume: meta.regularMarketVolume,
  };
}

async function fetchQuotes(symbols: string[]) {
  const results = await Promise.allSettled(symbols.map((symbol) => fetchChart(symbol)));

  const quotes = results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchChart>>> => r.status === 'fulfilled')
    .map((r) => metaToQuote(r.value.meta))
    .filter((q) => q.symbol && q.regularMarketPrice !== undefined);

  if (quotes.length === 0) {
    throw new Error('Failed to fetch market quotes');
  }

  return quotes;
}

function formatIntradayLabel(epochSec: number) {
  return new Date(epochSec * 1000).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

async function fetchLiveSession(symbol: string) {
  const result = await fetchChart(symbol, '1d', '5m');
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};
  const meta = result.meta;

  const points = timestamps
    .map((time, i) => {
      const close = quotes.close?.[i];
      if (close == null || close === 0) return null;
      return {
        time: new Date(time * 1000).toISOString(),
        label: formatIntradayLabel(time),
        close,
        volume: quotes.volume?.[i] ?? 0,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const livePrice = meta.regularMarketPrice ?? points[points.length - 1]?.close;
  if (livePrice && points.length > 0) {
    const last = points[points.length - 1];
    last.close = livePrice;
  }

  return {
    points,
    quote: metaToQuote(meta),
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'indices';
  const symbol = searchParams.get('symbol');
  const symbolsParam = searchParams.get('symbols');

  try {
    if (type === 'live' && symbol) {
      const live = await fetchLiveSession(symbol);
      return NextResponse.json({
        success: true,
        data: live.points,
        quote: live.quote,
        updatedAt: live.updatedAt,
      });
    }

    if (type === 'historical' && symbol) {
      const result = await fetchChart(symbol, '1mo');
      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0] || {};

      const historicalData: HistoricalDataPoint[] = timestamps
        .map((time: number, i: number) => ({
          date: new Date(time * 1000).toISOString().split('T')[0],
          open: quotes.open?.[i],
          high: quotes.high?.[i],
          low: quotes.low?.[i],
          close: quotes.close?.[i],
          volume: quotes.volume?.[i],
        }))
        .filter((d: HistoricalDataPoint) => d.close);

      return NextResponse.json({ success: true, data: historicalData });
    }

    let symbols: string[] = INDEX_SYMBOLS;

    if (type === 'popular') {
      symbols = POPULAR_SYMBOLS;
    } else if (symbolsParam) {
      symbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (symbol) {
      symbols = [symbol];
    }

    const quotes = await fetchQuotes(symbols);
    return NextResponse.json({ success: true, data: quotes });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
    console.error(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
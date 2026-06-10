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

/** Indices report zero intraday volume on Yahoo — use liquid ETF proxies instead. */
const INDEX_VOLUME_PROXY: Record<string, string> = {
  '^NSEI': 'NIFTYBEES.NS',
  '^NSEBANK': 'BANKBEES.NS',
  '^BSESN': 'NIFTYBEES.NS',
};
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

function hasVolumeData(points: { volume: number }[]) {
  return points.some((p) => p.volume > 0);
}

interface LivePoint {
  time: string;
  label: string;
  close: number;
  volume: number;
  epoch: number;
  quoteIndex: number;
}

function applyRangeVolumeFallback(points: LivePoint[], quotes: ChartQuote) {
  points.forEach((point) => {
    if (point.volume > 0) return;
    const high = quotes.high?.[point.quoteIndex];
    const low = quotes.low?.[point.quoteIndex];
    if (high != null && low != null && high > low) {
      point.volume = Math.round((high - low) * (point.close || 1));
    }
  });
}

async function mergeProxyVolume(points: LivePoint[], proxySymbol: string) {
  const proxy = await fetchChart(proxySymbol, '1d', '5m');
  const proxyTimestamps = proxy.timestamp || [];
  const proxyVolumes = proxy.indicators?.quote?.[0]?.volume || [];

  const volByTime = new Map<number, number>();
  proxyTimestamps.forEach((t, i) => {
    const v = proxyVolumes[i];
    if (v != null && v > 0) volByTime.set(t, v);
  });

  points.forEach((point) => {
    const vol = volByTime.get(point.epoch);
    if (vol != null && vol > 0) point.volume = vol;
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
        epoch: time,
        quoteIndex: i,
      };
    })
    .filter((p): p is LivePoint => p !== null);

  const livePrice = meta.regularMarketPrice ?? points[points.length - 1]?.close;
  if (livePrice && points.length > 0) {
    const last = points[points.length - 1];
    last.close = livePrice;
  }

  let volumeSource: 'native' | 'proxy' | 'range' = 'native';
  let volumeNote: string | undefined;

  if (!hasVolumeData(points)) {
    const proxySymbol = INDEX_VOLUME_PROXY[symbol];
    if (proxySymbol) {
      try {
        await mergeProxyVolume(points, proxySymbol);
        if (hasVolumeData(points)) {
          volumeSource = 'proxy';
          volumeNote = proxySymbol.replace('.NS', '');
        }
      } catch (e) {
        console.warn(`Volume proxy fetch failed for ${symbol}:`, e);
      }
    }

    if (!hasVolumeData(points)) {
      applyRangeVolumeFallback(points, quotes);
      if (hasVolumeData(points)) {
        volumeSource = 'range';
        volumeNote = 'price-range activity';
      }
    }
  }

  const clientPoints = points.map(({ time, label, close, volume }) => ({
    time,
    label,
    close,
    volume,
  }));

  return {
    points: clientPoints,
    quote: metaToQuote(meta),
    updatedAt: new Date().toISOString(),
    volumeSource,
    volumeNote,
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
        volumeSource: live.volumeSource,
        volumeNote: live.volumeNote,
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
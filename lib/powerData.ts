const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const NSE_HEADERS = {
  'User-Agent': USER_AGENT,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.nseindia.com/',
};

export async function fetchYahooChart(symbol: string, range = '3mo', interval = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, cache: 'no-store' });
  if (!res.ok) throw new Error(`Yahoo error ${res.status}`);
  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error('No chart data');
  return result as {
    meta: {
      symbol?: string;
      regularMarketPrice?: number;
      chartPreviousClose?: number;
      trailingPE?: number;
      shortName?: string;
    };
    timestamp?: number[];
    indicators?: {
      quote?: Array<{
        close?: number[];
        high?: number[];
        low?: number[];
        volume?: number[];
      }>;
    };
  };
}

export function linearTrend(closes: number[]): { slope: number; intercept: number } {
  const n = closes.length;
  if (n < 2) return { slope: 0, intercept: closes[0] ?? 0 };
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += closes[i];
    sumXY += i * closes[i];
    sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function extractCloses(chart: Awaited<ReturnType<typeof fetchYahooChart>>) {
  const timestamps = chart.timestamp || [];
  const closes = chart.indicators?.quote?.[0]?.close || [];
  return timestamps
    .map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      close: closes[i],
    }))
    .filter((d): d is { date: string; close: number } => d.close != null && d.close > 0);
}

export async function fetchNiftyTrend() {
  const chart = await fetchYahooChart('^NSEI', '3mo');
  const series = extractCloses(chart);
  const recent = series.slice(-20).map((d) => d.close);
  const { slope, intercept } = linearTrend(recent);
  const current = chart.meta.regularMarketPrice ?? recent[recent.length - 1];
  const nextDay = intercept + slope * recent.length;
  const nextWeek = intercept + slope * (recent.length + 5);
  const pctDay = ((nextDay - current) / current) * 100;
  const pctWeek = ((nextWeek - current) / current) * 100;

  return {
    current_price: current,
    trend_slope: slope,
    predicted_next_day: Math.round(nextDay * 100) / 100,
    predicted_week: Math.round(nextWeek * 100) / 100,
    pct_day: Math.round(pctDay * 100) / 100,
    pct_week: Math.round(pctWeek * 100) / 100,
    recent_closes: recent.slice(-5).join(','),
    direction: slope > 0 ? 'upward' : slope < 0 ? 'downward' : 'flat',
  };
}

interface FiiDiiRow {
  category?: string;
  date?: string;
  buyValue?: string;
  sellValue?: string;
  netValue?: string;
}

export async function fetchFiiDiiFlows() {
  try {
    await fetch('https://www.nseindia.com', { headers: NSE_HEADERS, cache: 'no-store' });
    const res = await fetch('https://www.nseindia.com/api/fiidiiTradeReact', {
      headers: NSE_HEADERS,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('NSE FII/DII unavailable');
    const rows = (await res.json()) as FiiDiiRow[];

    const fii = rows.find((r) => r.category?.toLowerCase().includes('fii'));
    const dii = rows.find((r) => r.category?.toLowerCase().includes('dii'));

    const parse = (v?: string) => {
      if (!v) return 0;
      return parseFloat(v.replace(/,/g, '')) || 0;
    };

    return {
      date: fii?.date || dii?.date || new Date().toISOString().slice(0, 10),
      fii_buy_cr: parse(fii?.buyValue),
      fii_sell_cr: parse(fii?.sellValue),
      fii_net_cr: parse(fii?.netValue),
      dii_buy_cr: parse(dii?.buyValue),
      dii_sell_cr: parse(dii?.sellValue),
      dii_net_cr: parse(dii?.netValue),
    };
  } catch {
    return {
      date: new Date().toISOString().slice(0, 10),
      fii_buy_cr: 0,
      fii_sell_cr: 0,
      fii_net_cr: 0,
      dii_buy_cr: 0,
      dii_sell_cr: 0,
      dii_net_cr: 0,
      fallback: true,
    };
  }
}

const FNO_CANDIDATES = [
  'RELIANCE.NS',
  'TCS.NS',
  'HDFCBANK.NS',
  'INFY.NS',
  'ICICIBANK.NS',
  'SBIN.NS',
  'BAJFINANCE.NS',
  'NIFTYBEES.NS',
  'BANKBEES.NS',
];

export async function fetchFnoLeader() {
  const results = await Promise.allSettled(FNO_CANDIDATES.map((s) => fetchYahooChart(s, '5d')));

  let topSymbol = FNO_CANDIDATES[0];
  let topVolume = 0;
  let topPrice = 0;
  let trendPct = 0;

  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    const vol = r.value.indicators?.quote?.[0]?.volume || [];
    const closes = r.value.indicators?.quote?.[0]?.close || [];
    const totalVol = vol.reduce((s, v) => s + (v || 0), 0);
    if (totalVol > topVolume) {
      topVolume = totalVol;
      topSymbol = FNO_CANDIDATES[i];
      topPrice = r.value.meta.regularMarketPrice ?? closes[closes.length - 1] ?? 0;
      const first = closes.find((c) => c != null && c > 0);
      const last = closes[closes.length - 1];
      if (first && last) trendPct = ((last - first) / first) * 100;
    }
  });

  const allVolumes = results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchYahooChart>>> => r.status === 'fulfilled')
    .map((r) => {
      const vol = r.value.indicators?.quote?.[0]?.volume || [];
      return vol.reduce((s, v) => s + (v || 0), 0);
    });
  const totalMarketVol = allVolumes.reduce((s, v) => s + v, 0);
  const volumeShare = totalMarketVol > 0 ? (topVolume / totalMarketVol) * 100 : 0;

  return {
    top_symbol: topSymbol,
    volume_share_pct: Math.round(volumeShare * 10) / 10,
    current_price: topPrice,
    trend_pct: Math.round(trendPct * 100) / 100,
    trend: trendPct > 0.5 ? 'bullish' : trendPct < -0.5 ? 'bearish' : 'neutral',
  };
}

export async function fetchEquityFundamentals(symbol: string) {
  const chart = await fetchYahooChart(symbol, '1y');
  const series = extractCloses(chart);
  const closes = series.map((d) => d.close);
  const yearAgo = closes[0];
  const current = chart.meta.regularMarketPrice ?? closes[closes.length - 1];
  const growthPct = yearAgo ? ((current - yearAgo) / yearAgo) * 100 : 0;
  const { slope } = linearTrend(closes.slice(-60));
  const highs = chart.indicators?.quote?.[0]?.high || [];
  const lows = chart.indicators?.quote?.[0]?.low || [];
  const recentHigh = Math.max(...highs.filter((h): h is number => h != null).slice(-30));
  const recentLow = Math.min(...lows.filter((l): l is number => l != null).slice(-30));

  return {
    symbol,
    company_name: chart.meta.shortName || symbol,
    current_price: current,
    pe_ratio: chart.meta.trailingPE,
    yoy_growth_pct: Math.round(growthPct * 10) / 10,
    trend_60d_slope: Math.round(slope * 100) / 100,
    support: recentLow,
    resistance: recentHigh,
    recent_closes: closes.slice(-5).join(','),
  };
}

export async function fetchIpoHeadlines() {
  const gnewsKey = process.env.GNEWS_API_KEY;
  const queries = ['India IPO 2025 2026 listing', 'India upcoming IPO subscription'];
  const headlines: { title: string; date: string }[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    if (gnewsKey) {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&country=in&max=5&apikey=${gnewsKey}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        for (const a of data.articles || []) {
          const key = a.title?.toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            headlines.push({ title: a.title.slice(0, 140), date: (a.publishedAt || '').slice(0, 10) });
          }
        }
      }
    }
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const rssRes = await fetch(rssUrl, { cache: 'no-store' });
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xml)) !== null && headlines.length < 12) {
        const title = match[1]
          .match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]
          ?.trim();
        if (title && !seen.has(title.toLowerCase())) {
          seen.add(title.toLowerCase());
          headlines.push({ title: title.slice(0, 140), date: new Date().toISOString().slice(0, 10) });
        }
      }
    }
  }

  return headlines.slice(0, 10);
}
import type { ReportStockRow } from '../types/dailyReport';
import { getNifty500Registry } from './nifty500';
import { fetchYahooChart, extractCloses, fetchFiiDiiFlows, fetchNiftyTrend } from './powerData';
import { fetchIpoFactRecords } from './ipoFacts';
import { calculateRSI, calculateSMA } from './technicalAnalysis';

const SCREEN_UNIVERSE = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS',
  'BAJFINANCE.NS', 'HINDUNILVR.NS', 'ITC.NS', 'LT.NS', 'AXISBANK.NS', 'KOTAKBANK.NS',
  'BHARTIARTL.NS', 'MARUTI.NS', 'SUNPHARMA.NS', 'TATAMOTORS.NS', 'WIPRO.NS', 'HCLTECH.NS',
  'NTPC.NS', 'POWERGRID.NS', 'ONGC.NS', 'COALINDIA.NS', 'ADANIENT.NS', 'TATASTEEL.NS',
  'JSWSTEEL.NS', 'BEL.NS', 'HAL.NS', 'PNB.NS', 'BANKBARODA.NS', 'CANBK.NS',
  'ASIANPAINT.NS', 'NESTLEIND.NS', 'ULTRACEMCO.NS', 'EICHERMOT.NS', 'M&M.NS',
  'HEROMOTOCO.NS', 'BAJAJ-AUTO.NS', 'DIVISLAB.NS', 'CIPLA.NS', 'DRREDDY.NS',
  'APOLLOHOSP.NS', 'TITAN.NS', 'DMART.NS', 'INDIGO.NS', 'IRCTC.NS', 'VEDL.NS',
  'HINDALCO.NS', 'GRASIM.NS', 'ADANIPORTS.NS', 'TECHM.NS', 'BPCL.NS', 'IOC.NS',
  'SIEMENS.NS', 'ABB.NS', 'DIXON.NS', 'POLYCAB.NS', 'PERSISTENT.NS', 'LTIM.NS',
];

export interface ScoredStock {
  symbol: string;
  stock: string;
  sector: string;
  cmp: number;
  pe: number | null;
  change_pct: number;
  rsi: number | null;
  above_sma50: boolean;
  above_sma200: boolean;
  momentum_20d: number;
  conviction_score: number;
  risk_score: number;
}

async function fetchIndexClose(symbol: string): Promise<number | null> {
  try {
    const chart = await fetchYahooChart(symbol, '5d');
    return chart.meta.regularMarketPrice ?? null;
  } catch {
    return null;
  }
}

async function scoreStock(symbol: string): Promise<ScoredStock | null> {
  try {
    const registry = getNifty500Registry();
    const meta = registry.find((s) => s.symbol === symbol);
    const chart = await fetchYahooChart(symbol, '1y');
    const series = extractCloses(chart);
    const prices = series.map((d) => d.close);
    if (prices.length < 30) return null;

    const cmp = chart.meta.regularMarketPrice ?? prices[prices.length - 1];
    const prev = chart.meta.chartPreviousClose ?? prices[prices.length - 2];
    const changePct = prev ? ((cmp - prev) / prev) * 100 : 0;
    const rsiArr = calculateRSI(prices);
    const rsi = rsiArr.filter((v): v is number => v != null).pop() ?? null;
    const sma50 = calculateSMA(prices, 50).filter((v): v is number => v != null).pop();
    const sma200 = calculateSMA(prices, 200).filter((v): v is number => v != null).pop();
    const mom20 = prices.length >= 20 ? ((cmp - prices[prices.length - 20]) / prices[prices.length - 20]) * 100 : 0;

    let conviction = 50;
    if (rsi != null && rsi > 45 && rsi < 70) conviction += 10;
    if (sma50 && cmp > sma50) conviction += 8;
    if (sma200 && cmp > sma200) conviction += 8;
    if (mom20 > 5) conviction += 12;
    else if (mom20 > 0) conviction += 5;
    if (changePct > 0) conviction += 4;

    let risk = 40;
    if (rsi != null && rsi > 75) risk += 15;
    if (mom20 < -5) risk += 12;
    if (changePct < -2) risk += 8;

    conviction = Math.min(95, Math.max(20, Math.round(conviction)));
    risk = Math.min(90, Math.max(15, Math.round(risk)));

    return {
      symbol,
      stock: meta?.companyName || chart.meta.shortName || symbol.replace('.NS', ''),
      sector: meta?.industry || 'Unknown',
      cmp: Math.round(cmp * 100) / 100,
      pe: chart.meta.trailingPE ?? null,
      change_pct: Math.round(changePct * 100) / 100,
      rsi: rsi != null ? Math.round(rsi) : null,
      above_sma50: sma50 ? cmp > sma50 : false,
      above_sma200: sma200 ? cmp > sma200 : false,
      momentum_20d: Math.round(mom20 * 10) / 10,
      conviction_score: conviction,
      risk_score: risk,
    };
  } catch {
    return null;
  }
}

async function batchScore(symbols: string[], batchSize = 8): Promise<ScoredStock[]> {
  const results: ScoredStock[] = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map((s) => scoreStock(s)));
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
  }
  return results;
}

function buildTop200(scored: ScoredStock[]): ReportStockRow[] {
  const registry = getNifty500Registry();
  const sectorAvg = new Map<string, { conviction: number; risk: number; count: number }>();

  for (const s of scored) {
    const e = sectorAvg.get(s.sector) || { conviction: 0, risk: 0, count: 0 };
    e.conviction += s.conviction_score;
    e.risk += s.risk_score;
    e.count += 1;
    sectorAvg.set(s.sector, e);
  }

  const scoredMap = new Map(scored.map((s) => [s.symbol, s]));
  const rows = registry.map((stock) => {
    const direct = scoredMap.get(stock.symbol);
    if (direct) {
      return {
        rank: 0,
        stock: direct.stock,
        symbol: direct.symbol,
        sector: direct.sector,
        cmp: direct.cmp,
        buy_zone: `₹${Math.round(direct.cmp * 0.97)}–₹${direct.cmp}`,
        conviction_score: direct.conviction_score,
        risk_score: direct.risk_score,
      };
    }
    const avg = sectorAvg.get(stock.industry);
    const conv = avg ? Math.round(avg.conviction / avg.count) - 5 : 45;
    const risk = avg ? Math.round(avg.risk / avg.count) : 50;
    return {
      rank: 0,
      stock: stock.companyName,
      symbol: stock.symbol,
      sector: stock.industry,
      cmp: null,
      buy_zone: 'Screening pending',
      conviction_score: Math.max(25, Math.min(75, conv)),
      risk_score: risk,
    };
  });

  rows.sort((a, b) => b.conviction_score - a.conviction_score || (b.cmp ?? 0) - (a.cmp ?? 0));
  return rows.slice(0, 200).map((r, i) => ({ ...r, rank: i + 1 }));
}

export async function gatherDailyReportData() {
  const [nifty, bankNifty, sensex, vix, flows, niftyTrend, scored, ipoUpcoming, ipoRecent] =
    await Promise.all([
      fetchIndexClose('^NSEI'),
      fetchIndexClose('^NSEBANK'),
      fetchIndexClose('^BSESN'),
      fetchIndexClose('^INDIAVIX'),
      fetchFiiDiiFlows(),
      fetchNiftyTrend(20),
      batchScore(SCREEN_UNIVERSE),
      fetchIpoFactRecords('upcoming'),
      fetchIpoFactRecords('recent'),
    ]);

  const top200 = buildTop200(scored);
  const top25Symbols = top200.filter((r) => r.cmp != null).slice(0, 25);
  const top25Scored = scored
    .sort((a, b) => b.conviction_score - a.conviction_score)
    .slice(0, 25);

  const registry = getNifty500Registry();
  const sectorCounts = new Map<string, number>();
  for (const s of registry) {
    sectorCounts.set(s.industry, (sectorCounts.get(s.industry) || 0) + 1);
  }

  const compactScored = scored
    .sort((a, b) => b.conviction_score - a.conviction_score)
    .map((s) =>
      `${s.symbol}|${s.cmp}|${s.change_pct}%|RSI${s.rsi ?? 'NA'}|mom20d:${s.momentum_20d}|conv:${s.conviction_score}|risk:${s.risk_score}|PE:${s.pe ?? 'NA'}`
    )
    .join('\n');

  const compactTop200 = top200
    .slice(0, 60)
    .map((r) => `${r.rank}|${r.symbol}|${r.sector}|CMP:${r.cmp ?? 'NA'}|conv:${r.conviction_score}|risk:${r.risk_score}`)
    .join('\n');

  const ipoPayload = [...ipoUpcoming.slice(0, 4), ...ipoRecent.slice(0, 4)]
    .map((i) =>
      `${i.symbol}|${i.name}|${i.status}|issue:${i.numbers.issue_price ?? 'NA'}|gain:${i.numbers.listing_gain_pct ?? 'NA'}%`
    )
    .join('\n');

  return {
    report_date: new Date().toISOString().slice(0, 10),
    indices: {
      nifty,
      bank_nifty: bankNifty,
      sensex,
      vix,
      nifty_trend: niftyTrend,
    },
    flows,
    top200,
    top25Scored,
    top25Symbols,
    sectorCounts: Object.fromEntries(sectorCounts),
    compactScored,
    compactTop200,
    ipoPayload,
    universe_size: registry.length,
    data_sources: ['NSE India', 'Yahoo Finance', 'Nifty 500 Registry', 'GNews'],
  };
}

export type DailyReportData = Awaited<ReturnType<typeof gatherDailyReportData>>;
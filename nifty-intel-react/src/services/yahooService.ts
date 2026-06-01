import type { Stock, Quote, HistoryData } from '@/types';
import MathEngine from '@/utils/mathEngine';
import ScoringEngine from '@/utils/scoringEngine';
import RationaleEngine from '@/utils/rationaleEngine';

const PROXIES = [
  'https://corsproxy.io/?url=',
  'https://api.allorigins.win/raw?url=',
  'https://cors.sh/?',
];
const BATCH_SIZE = 250;
const TIMEOUT_MS = 20000;

export class YahooService {
  static async fetchQuoteBatch(tickers: string[]): Promise<Quote[]> {
    const symbolsStr = tickers.join(',');
    const fields = [
      'regularMarketPrice',
      'regularMarketChangePercent',
      'regularMarketVolume',
      'averageVolume',
      'fiftyTwoWeekHigh',
      'fiftyTwoWeekLow',
      'marketCap',
      'trailingPE',
      'priceToBook',
      'trailingEps',
      'trailingAnnualDividendYield',
      'beta',
    ].join(',');
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolsStr)}&fields=${fields}`;
    const res = await this._fetchRace(yahooUrl);

    if (!res.ok) throw new Error(`Yahoo batch failed: ${res.status}`);
    const data = await res.json();
    return data?.quoteResponse?.result || [];
  }

  static async fetchStockHistory(ticker: string): Promise<HistoryData | null> {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
    const res = await this._fetchRace(yahooUrl);

    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const highs = result.indicators?.quote?.[0]?.high || [];
    const lows = result.indicators?.quote?.[0]?.low || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];

    const validPairs = timestamps
      .map((t: number, i: number) => ({
        t,
        c: closes[i],
        h: highs[i],
        l: lows[i],
        v: volumes[i],
      }))
      .filter((p: any) => p.c !== null && p.c !== undefined);

    if (validPairs.length < 20) return null;

    const prices = validPairs.map((p: any) => p.c);
    const dates = validPairs.map((p: any) =>
      new Date(p.t * 1000).toISOString().split('T')[0]
    );
    const vols = validPairs.map((p: any) => p.v || 0);
    const highArr = validPairs.map((p: any) => p.h || p.c);
    const lowArr = validPairs.map((p: any) => p.l || p.c);

    return {
      prices,
      dates,
      volumes: vols,
      highs: highArr,
      lows: lowArr,
    };
  }

  static async _fetchRace(url: string): Promise<Response> {
    const acs = PROXIES.map(() => new AbortController());
    const timer = setTimeout(() => acs.forEach((ac) => ac.abort()), TIMEOUT_MS);
    let winnerIdx = -1;

    try {
      const attempts = PROXIES.map((proxy, i) =>
        fetch(proxy + encodeURIComponent(url), { signal: acs[i].signal })
          .then((r) => {
            if (!r.ok) throw new Error(r.status.toString());
            winnerIdx = i;
            return r;
          })
      );
      const res = await Promise.any(attempts);
      clearTimeout(timer);
      acs.forEach((ac, i) => {
        if (i !== winnerIdx) ac.abort();
      });
      return res;
    } catch {
      clearTimeout(timer);
      throw new Error('All data sources unavailable');
    }
  }
}

export default YahooService;

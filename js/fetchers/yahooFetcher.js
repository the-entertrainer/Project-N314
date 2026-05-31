import State from '../state.js';
import MathEngine from '../engines/mathEngine.js';
import ScoringEngine from '../engines/scoringEngine.js';
import RationaleEngine from '../engines/rationaleEngine.js';
import NIFTY500 from '../data/nifty500.js';

const PROXY = 'https://corsproxy.io/?url=';
const BATCH_SIZE = 100;
const TIMEOUT_MS = 20000;

export class YahooFetcher {
  static async fetchAll500(onProgress) {
    const tickers = NIFTY500.map(s => s.ticker);
    const batches = [];
    for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
      batches.push(tickers.slice(i, i + BATCH_SIZE));
    }

    State.setFetchStatus('loading');
    const allStocks = new Map();

    // Pre-populate from static data
    for (const s of NIFTY500) {
      allStocks.set(s.ticker, { ...s, score: 0, grade: 'C' });
    }

    for (let i = 0; i < batches.length; i++) {
      if (onProgress) onProgress(i + 1, batches.length);
      try {
        const quotes = await this._fetchBatchQuotes(batches[i]);
        for (const q of quotes) {
          const existing = allStocks.get(q.symbol) || {};
          allStocks.set(q.symbol, {
            ...existing,
            ticker: q.symbol,
            cmp: q.regularMarketPrice,
            returnDaily: q.regularMarketChangePercent,
            high52w: q.fiftyTwoWeekHigh,
            low52w: q.fiftyTwoWeekLow,
            marketCap: q.marketCap,
            pe: q.trailingPE,
            pb: q.priceToBook,
            eps: q.trailingEps,
            divYield: q.trailingAnnualDividendYield ? q.trailingAnnualDividendYield * 100 : null,
            beta: q.beta,
            volume: q.regularMarketVolume,
            avgVolume: q.averageVolume,
            volumeVsAvg: q.averageVolume > 0 ? q.regularMarketVolume / q.averageVolume : 1,
          });
        }
      } catch (e) {
        console.warn(`Batch ${i + 1} failed:`, e);
      }
      await this._yield();
    }

    State.setAllStocks([...allStocks.values()]);

    // Score all 500
    const scoreMap = ScoringEngine.scoreAll(State.stocks);
    ScoringEngine.applyScoresToState(State.stocks, scoreMap);

    // Fetch history for top 100
    const top100 = State.getTopN(100);
    await this.fetchHistoryBatch(top100, (done, total) => {
      if (onProgress) onProgress(batches.length + done, batches.length + total);
    });

    State.setFetchStatus('done');
  }

  static async fetchHistoryBatch(stocks, onProgress) {
    const CHUNK = 10;
    for (let i = 0; i < stocks.length; i += CHUNK) {
      const chunk = stocks.slice(i, i + CHUNK);
      await Promise.allSettled(chunk.map(s => this._fetchAndProcessHistory(s.ticker)));
      if (onProgress) onProgress(Math.min(i + CHUNK, stocks.length), stocks.length);
      await this._yield();
    }

    // Re-score with enriched data
    const scoreMap = ScoringEngine.scoreAll(State.stocks);
    ScoringEngine.applyScoresToState(State.stocks, scoreMap);

    // Build rationale for top 100
    for (const s of stocks) {
      const stock = State.stocks.get(s.ticker);
      if (stock) {
        stock.rationale = RationaleEngine.buildStockRationale(stock);
      }
    }
  }

  static async fetchFundamentals(stocks) {
    for (const s of stocks) {
      try {
        await this._fetchFundamentals(s.ticker);
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        // Non-fatal
      }
    }
  }

  static async _fetchBatchQuotes(tickers) {
    const symbolsStr = tickers.join(',');
    const fields = [
      'regularMarketPrice', 'regularMarketChangePercent', 'regularMarketVolume',
      'averageVolume', 'fiftyTwoWeekHigh', 'fiftyTwoWeekLow', 'marketCap',
      'trailingPE', 'priceToBook', 'trailingEps', 'trailingAnnualDividendYield', 'beta'
    ].join(',');
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolsStr)}&fields=${fields}`;
    const url = `${PROXY}${encodeURIComponent(yahooUrl)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`Yahoo batch failed: ${res.status}`);
    const data = await res.json();
    return data?.quoteResponse?.result || [];
  }

  static async _fetchAndProcessHistory(ticker) {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
    const url = `${PROXY}${encodeURIComponent(yahooUrl)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return;

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const highs = result.indicators?.quote?.[0]?.high || [];
    const lows = result.indicators?.quote?.[0]?.low || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];

    const validPairs = timestamps
      .map((t, i) => ({ t, c: closes[i], h: highs[i], l: lows[i], v: volumes[i] }))
      .filter(p => p.c !== null && p.c !== undefined);

    if (validPairs.length < 20) return;

    const prices = validPairs.map(p => p.c);
    const dates = validPairs.map(p => new Date(p.t * 1000).toISOString().split('T')[0]);
    const vols = validPairs.map(p => p.v || 0);
    const highArr = validPairs.map(p => p.h || p.c);
    const lowArr = validPairs.map(p => p.l || p.c);

    const rsiArr = MathEngine.calculateRSI(prices);
    const macdData = MathEngine.calculateMACD(prices);
    const sma20 = MathEngine.calculateSMA(prices, 20);
    const sma50 = MathEngine.calculateSMA(prices, 50);
    const sma200 = MathEngine.calculateSMA(prices, 200);
    const { support1, support2, resistance1, resistance2 } = MathEngine.calculateSupportsResistances(prices);
    const atr = MathEngine.calculateATR(highArr, lowArr, prices);
    const histVol = MathEngine.calculateHistoricalVol(prices);
    const trend = MathEngine.detectMATrend(sma20, sma50, sma200);
    const volumeVsAvg = MathEngine.calculateVolumeRatio(vols);

    const n = prices.length;
    const returnMonthly = n > 21 ? ((prices[n - 1] - prices[n - 22]) / prices[n - 22]) * 100 : 0;
    const returnQuarterly = n > 63 ? ((prices[n - 1] - prices[n - 64]) / prices[n - 64]) * 100 : 0;
    const return1y = n > 1 ? ((prices[n - 1] - prices[0]) / prices[0]) * 100 : 0;
    const return5d = n > 5 ? ((prices[n - 1] - prices[n - 6]) / prices[n - 6]) * 100 : 0;

    const stock = State.stocks.get(ticker);
    if (!stock) return;

    Object.assign(stock, {
      rawPrices: prices,
      rawDates: dates,
      rsi: rsiArr[n - 1] || null,
      macd: macdData.macdLine[n - 1] || null,
      macdSignal: macdData.signalLine[n - 1] || null,
      maStatus: macdData.histogram[n - 1] > 0 ? 'BULLISH' : 'BEARISH',
      trend,
      support1, support2, resistance1, resistance2,
      atr,
      historicalVol: histVol,
      volumeVsAvg,
      returnMonthly,
      returnQuarterly,
      return1y,
      return5d,
    });
  }

  static async _fetchFundamentals(ticker) {
    const modules = 'financialData,defaultKeyStatistics,incomeStatementHistory';
    const yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules}`;
    const url = `${PROXY}${encodeURIComponent(yahooUrl)}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return;
    const data = await res.json();
    const result = data?.quoteSummary?.result?.[0];
    if (!result) return;

    const fd = result.financialData || {};
    const ks = result.defaultKeyStatistics || {};
    const is = result.incomeStatementHistory?.incomeStatementHistory?.[0] || {};

    const stock = State.stocks.get(ticker);
    if (!stock) return;

    const totalRevenue = is.totalRevenue?.raw;
    const netIncome = is.netIncome?.raw;

    Object.assign(stock, {
      roe: fd.returnOnEquity?.raw ? fd.returnOnEquity.raw * 100 : null,
      debtEquity: fd.debtToEquity?.raw ? fd.debtToEquity.raw / 100 : null,
      profitMargin: fd.profitMargins?.raw ? fd.profitMargins.raw * 100 : null,
      revenueGrowth: fd.revenueGrowth?.raw ? fd.revenueGrowth.raw * 100 : null,
      revenueFY24: totalRevenue || null,
      currentRatio: fd.currentRatio?.raw || null,
      quickRatio: fd.quickRatio?.raw || null,
    });
  }

  static _yield() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
}

export default YahooFetcher;

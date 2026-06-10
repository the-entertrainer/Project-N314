export function calculateSMA(prices: number[], period: number): (number | null)[] {
  if (!prices.length || period > prices.length) {
    return Array(prices.length).fill(null);
  }

  const sma: (number | null)[] = Array(prices.length).fill(null);
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += prices[j];
    sma[i] = sum / period;
  }
  return sma;
}

export function calculateRSI(prices: number[], period = 14): (number | null)[] {
  if (prices.length < period + 1) return Array(prices.length).fill(null);

  const rsi: (number | null)[] = Array(prices.length).fill(null);
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const delta = prices[i] - prices[i - 1];
    gains.push(delta > 0 ? delta : 0);
    losses.push(delta < 0 ? Math.abs(delta) : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < prices.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }

  return rsi;
}

function calculateEMA(values: number[], period: number): (number | null)[] {
  const ema: (number | null)[] = Array(values.length).fill(null);
  if (!values.length) return ema;

  const multiplier = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < Math.min(period, values.length); i++) sum += values[i];
  let current = sum / Math.min(period, values.length);

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      ema[i] = null;
    } else if (i === period - 1) {
      ema[i] = current;
    } else {
      current = values[i] * multiplier + current * (1 - multiplier);
      ema[i] = current;
    }
  }
  return ema;
}

export function calculateMACD(
  prices: number[],
  fast = 12,
  slow = 26,
  signal = 9
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  if (prices.length < slow) {
    return { macd: [], signal: [], histogram: [] };
  }

  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  const macd: (number | null)[] = emaFast.map((fastVal, i) => {
    if (fastVal === null || emaSlow[i] === null) return null;
    return fastVal - emaSlow[i];
  });

  const validMacd = macd.filter((m): m is number => m !== null);
  const emaSignal = calculateEMA(validMacd, signal);
  const signalLine: (number | null)[] = Array(macd.length).fill(null);
  const histogram: (number | null)[] = Array(macd.length).fill(null);

  let idx = 0;
  for (let i = 0; i < macd.length; i++) {
    if (macd[i] === null) continue;
    const sig = emaSignal[idx];
    signalLine[i] = sig;
    histogram[i] = sig !== null ? macd[i]! - sig : null;
    idx++;
  }

  return { macd, signal: signalLine, histogram };
}

export function calculateTrend(prices: number[]): number {
  if (prices.length < 10) return 0;
  const recent = prices.slice(-20);
  const first = recent[0];
  const last = recent[recent.length - 1];
  return first ? ((last - first) / first) * 100 : 0;
}

export function calculateVolatility(prices: number[]): number {
  if (prices.length < 5) return 0;
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1]) returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

export interface TechnicalSnapshot {
  rsi: number | null;
  sma50: number | null;
  sma200: number | null;
  macd: number | null;
  macdSignal: number | null;
  trend30d: number;
  volatility: number;
  support: number;
  resistance: number;
}

export function buildTechnicalSnapshot(
  prices: number[],
  highs: number[],
  lows: number[]
): TechnicalSnapshot {
  const rsiArr = calculateRSI(prices);
  const sma50Arr = calculateSMA(prices, 50);
  const sma200Arr = calculateSMA(prices, 200);
  const macdResult = calculateMACD(prices);

  const last = prices.length - 1;
  const recentLows = lows.filter(Boolean).slice(-20);
  const recentHighs = highs.filter(Boolean).slice(-20);

  return {
    rsi: rsiArr[last],
    sma50: sma50Arr[last],
    sma200: sma200Arr[last],
    macd: macdResult.macd[last] ?? null,
    macdSignal: macdResult.signal[last] ?? null,
    trend30d: calculateTrend(prices),
    volatility: calculateVolatility(prices),
    support: recentLows.length ? Math.min(...recentLows) : prices[last],
    resistance: recentHighs.length ? Math.max(...recentHighs) : prices[last],
  };
}

export interface ChartSeriesPoint {
  date: string;
  close: number;
  volume: number;
  sma50: number | null;
  sma200: number | null;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
}

export function buildChartSeries(
  dates: string[],
  closes: number[],
  volumes: number[]
): ChartSeriesPoint[] {
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);

  return dates.map((date, i) => ({
    date,
    close: closes[i],
    volume: volumes[i] || 0,
    sma50: sma50[i],
    sma200: sma200[i],
    rsi: rsi[i],
    macd: macd.macd[i] ?? null,
    macdSignal: macd.signal[i] ?? null,
    macdHistogram: macd.histogram[i] ?? null,
  }));
}
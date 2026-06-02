import type { HistoricalBar } from '../types';

export function calcSMA(closes: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { result.push(NaN); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

export function calcEMA(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) { result.push(closes[0]); continue; }
    result.push(closes[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff >= 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calcMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine.filter((v) => !isNaN(v)), 9);
  const lastMacd = macdLine[macdLine.length - 1] ?? 0;
  const lastSignal = signalLine[signalLine.length - 1] ?? 0;
  return { macd: lastMacd, signal: lastSignal, histogram: lastMacd - lastSignal };
}

export function calcBollingerBands(closes: number[], period = 20, stdMult = 2) {
  const result: Array<{ upper: number; mid: number; lower: number }> = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) { result.push({ upper: NaN, mid: NaN, lower: NaN }); continue; }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    result.push({ upper: mean + stdMult * std, mid: mean, lower: mean - stdMult * std });
  }
  return result;
}

export function calcSupportResistance(bars: HistoricalBar[], lookback = 20): { support: number; resistance: number } {
  const recent = bars.slice(-lookback);
  const lows  = recent.map((b) => b.low);
  const highs = recent.map((b) => b.high);
  return {
    support:    Math.min(...lows),
    resistance: Math.max(...highs),
  };
}

export function enrichWithIndicators(bars: HistoricalBar[]): {
  rsi14: number; ma50: number; ma200: number;
  support: number; resistance: number;
  macd: { macd: number; signal: number; histogram: number };
  bollinger: { upper: number; mid: number; lower: number };
} {
  const closes = bars.map((b) => b.close);
  const sma50  = calcSMA(closes, 50);
  const sma200 = calcSMA(closes, 200);
  const bb     = calcBollingerBands(closes);
  const { support, resistance } = calcSupportResistance(bars);

  const last = closes.length - 1;
  return {
    rsi14:      calcRSI(closes),
    ma50:       sma50[last] ?? 0,
    ma200:      sma200[last] ?? 0,
    support,
    resistance,
    macd:       calcMACD(closes),
    bollinger:  bb[last] ?? { upper: 0, mid: 0, lower: 0 },
  };
}

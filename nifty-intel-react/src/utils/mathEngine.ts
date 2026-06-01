export class MathEngine {
  static calculateRSI(prices: number[], period = 14): number[] {
    if (prices.length < period + 1) return prices.map(() => 50);

    const rsi: number[] = [];
    let gainSum = 0,
      lossSum = 0;

    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gainSum += diff;
      else lossSum += Math.abs(diff);
    }

    let avgGain = gainSum / period;
    let avgLoss = lossSum / period;
    rsi[period] =
      avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rsi[i] =
        avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }

    return rsi;
  }

  static calculateMACD(
    prices: number[],
    fast = 12,
    slow = 26,
    signal = 9
  ): {
    macdLine: number[];
    signalLine: number[];
    histogram: number[];
  } {
    const emaFast = this._calculateEMA(prices, fast);
    const emaSlow = this._calculateEMA(prices, slow);
    const macdLine = emaFast.map((f, i) => f - (emaSlow[i] || 0));
    const signalLine = this._calculateEMA(macdLine, signal);
    const histogram = macdLine.map((m, i) => m - (signalLine[i] || 0));

    return { macdLine, signalLine, histogram };
  }

  static calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) sma[i] = 0;
      else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b);
        sma[i] = sum / period;
      }
    }
    return sma;
  }

  static calculateATR(
    highs: number[],
    lows: number[],
    closes: number[],
    period = 14
  ): number {
    const tr: number[] = [];
    for (let i = 0; i < highs.length; i++) {
      const h = highs[i];
      const l = lows[i];
      const c = i > 0 ? closes[i - 1] : closes[i];
      const tr1 = h - l;
      const tr2 = Math.abs(h - c);
      const tr3 = Math.abs(l - c);
      tr[i] = Math.max(tr1, tr2, tr3);
    }

    if (tr.length < period) return 0;
    const atr = tr.slice(-period).reduce((a, b) => a + b) / period;
    return atr;
  }

  static calculateHistoricalVol(prices: number[], period = 20): number {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(
        Math.log(prices[i] / prices[i - 1])
      );
    }
    if (returns.length < period) return 0;
    const recentReturns = returns.slice(-period);
    const mean =
      recentReturns.reduce((a, b) => a + b) / recentReturns.length;
    const variance =
      recentReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
      recentReturns.length;
    return Math.sqrt(variance * 252) * 100;
  }

  static calculateVolumeRatio(volumes: number[]): number {
    if (volumes.length < 20) return 1;
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b) / 20;
    return volumes[volumes.length - 1] / (avgVolume || 1);
  }

  static detectMATrend(
    sma20: number[],
    sma50: number[],
    sma200: number[]
  ): string {
    const n = Math.min(sma20.length, sma50.length, sma200.length) - 1;
    if (n < 0) return 'UNKNOWN';

    const s20 = sma20[n];
    const s50 = sma50[n];
    const s200 = sma200[n];

    if (s20 > s50 && s50 > s200) return 'UPTREND';
    if (s20 < s50 && s50 < s200) return 'DOWNTREND';
    return 'SIDEWAYS';
  }

  static calculateSupportsResistances(prices: number[]): {
    support1: number;
    support2: number;
    resistance1: number;
    resistance2: number;
  } {
    if (prices.length < 20) {
      return { support1: 0, support2: 0, resistance1: 0, resistance2: 0 };
    }

    const last20 = prices.slice(-20);
    const high = Math.max(...last20);
    const low = Math.min(...last20);
    const close = prices[prices.length - 1];

    const pivot = (high + low + close) / 3;
    const range = high - low;

    return {
      resistance1: 2 * pivot - low,
      resistance2: pivot + range,
      support1: 2 * pivot - high,
      support2: pivot - range,
    };
  }

  private static _calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const k = 2 / (period + 1);

    let sum = 0;
    for (let i = 0; i < period && i < prices.length; i++) sum += prices[i];

    ema[period - 1] = sum / period;

    for (let i = period; i < prices.length; i++) {
      ema[i] = prices[i] * k + (ema[i - 1] || 0) * (1 - k);
    }

    return ema;
  }
}

export default MathEngine;

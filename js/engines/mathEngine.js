export class MathEngine {
  static calculateSMA(prices, period) {
    const result = new Array(prices.length).fill(null);
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      result[i] = slice.reduce((a, b) => a + b, 0) / period;
    }
    return result;
  }

  static _calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    const result = new Array(prices.length).fill(null);
    let ema = null;
    for (let i = 0; i < prices.length; i++) {
      if (prices[i] === null) continue;
      if (ema === null) {
        ema = prices[i];
      } else {
        ema = prices[i] * k + ema * (1 - k);
      }
      result[i] = ema;
    }
    return result;
  }

  static calculateRSI(prices, period = 14) {
    const result = new Array(prices.length).fill(null);
    if (prices.length < period + 1) return result;

    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period; i < prices.length; i++) {
      if (i > period) {
        const diff = prices[i] - prices[i - 1];
        avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
      }
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
    return result;
  }

  static calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
    const emaFast = this._calculateEMA(prices, fast);
    const emaSlow = this._calculateEMA(prices, slow);
    const macdLine = prices.map((_, i) =>
      emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i] - emaSlow[i] : null
    );
    const signalLine = this._calculateEMA(macdLine, signal);
    const histogram = macdLine.map((v, i) =>
      v !== null && signalLine[i] !== null ? v - signalLine[i] : null
    );
    return { macdLine, signalLine, histogram };
  }

  static calculateForecast(prices, days = 5) {
    const n = Math.min(30, prices.length);
    const recent = prices.slice(-n);
    const x = recent.map((_, i) => i);
    const y = recent;
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    const num = x.reduce((s, xi, i) => s + (xi - xMean) * (y[i] - yMean), 0);
    const den = x.reduce((s, xi) => s + (xi - xMean) ** 2, 0);
    const slope = den === 0 ? 0 : num / den;
    const intercept = yMean - slope * xMean;
    return Array.from({ length: days }, (_, i) => intercept + slope * (n + i));
  }

  static calculateSupportsResistances(prices, lookback = 20) {
    const supports = [], resistances = [];
    for (let i = lookback; i < prices.length - lookback; i++) {
      const slice = prices.slice(i - lookback, i + lookback + 1);
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      if (prices[i] === min) supports.push(prices[i]);
      if (prices[i] === max) resistances.push(prices[i]);
    }
    supports.sort((a, b) => b - a);
    resistances.sort((a, b) => a - b);
    return {
      support1: supports[0] || null,
      support2: supports[1] || null,
      resistance1: resistances[0] || null,
      resistance2: resistances[1] || null,
    };
  }

  static calculateBeta(stockPrices, niftyPrices) {
    if (!stockPrices || !niftyPrices || stockPrices.length < 2) return 1;
    const len = Math.min(stockPrices.length, niftyPrices.length);
    const sRet = [], nRet = [];
    for (let i = 1; i < len; i++) {
      sRet.push((stockPrices[i] - stockPrices[i - 1]) / stockPrices[i - 1]);
      nRet.push((niftyPrices[i] - niftyPrices[i - 1]) / niftyPrices[i - 1]);
    }
    const sMean = sRet.reduce((a, b) => a + b, 0) / sRet.length;
    const nMean = nRet.reduce((a, b) => a + b, 0) / nRet.length;
    const covar = sRet.reduce((s, r, i) => s + (r - sMean) * (nRet[i] - nMean), 0) / sRet.length;
    const nVar = nRet.reduce((s, r) => s + (r - nMean) ** 2, 0) / nRet.length;
    return nVar === 0 ? 1 : covar / nVar;
  }

  static calculateVolumeRatio(volumes, period = 20) {
    if (!volumes || volumes.length < period + 1) return 1;
    const recent = volumes[volumes.length - 1];
    const avg = volumes.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period;
    return avg === 0 ? 1 : recent / avg;
  }

  static detectMATrend(sma20, sma50, sma200) {
    const v20 = sma20?.at(-1);
    const v50 = sma50?.at(-1);
    const v200 = sma200?.at(-1);
    if (!v20 || !v50 || !v200) return 'NEUTRAL';
    if (v20 > v50 && v50 > v200) return 'BULLISH';
    if (v20 < v50 && v50 < v200) return 'BEARISH';
    if (v20 > v200) return 'MIXED_BULLISH';
    return 'MIXED_BEARISH';
  }

  static calculateATR(highs, lows, closes, period = 14) {
    if (!highs || highs.length < period + 1) return null;
    const tr = [];
    for (let i = 1; i < highs.length; i++) {
      tr.push(Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      ));
    }
    let atr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < tr.length; i++) {
      atr = (atr * (period - 1) + tr[i]) / period;
    }
    return atr;
  }

  static calculateHistoricalVol(prices, period = 20) {
    if (!prices || prices.length < period + 1) return null;
    const recent = prices.slice(-period - 1);
    const returns = [];
    for (let i = 1; i < recent.length; i++) {
      returns.push(Math.log(recent[i] / recent[i - 1]));
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
    return Math.sqrt(variance * 252);
  }

  static calculatePivots(high, low, close) {
    const pivot = (high + low + close) / 3;
    return {
      pivot,
      r1: 2 * pivot - low,
      r2: pivot + (high - low),
      r3: high + 2 * (pivot - low),
      s1: 2 * pivot - high,
      s2: pivot - (high - low),
      s3: low - 2 * (high - pivot),
    };
  }
}

export default MathEngine;

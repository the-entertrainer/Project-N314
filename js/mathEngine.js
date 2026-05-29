export class MathEngine {
  static calculateSMA(prices, period) {
    if (!prices || prices.length === 0) return [];
    if (period > prices.length) return Array(prices.length).fill(null);

    const sma = new Array(prices.length);
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma[i] = null;
      } else {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
          sum += prices[j];
        }
        sma[i] = sum / period;
      }
    }
    return sma;
  }

  static calculateRSI(prices, period = 14) {
    if (!prices || prices.length < period + 1) return [];

    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const delta = prices[i] - prices[i - 1];
      gains.push(delta > 0 ? delta : 0);
      losses.push(delta < 0 ? Math.abs(delta) : 0);
    }

    const rsi = new Array(prices.length);
    for (let i = 0; i < period; i++) {
      rsi[i] = null;
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

  static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (!prices || prices.length < slowPeriod) {
      return { macd: [], signal: [], histogram: [] };
    }

    const emaFast = this._calculateEMA(prices, fastPeriod);
    const emaSlow = this._calculateEMA(prices, slowPeriod);

    const macd = emaFast.map((fast, i) => {
      if (fast === null || emaSlow[i] === null) return null;
      return fast - emaSlow[i];
    });

    const validMacd = macd.filter(m => m !== null);
    const signal = new Array(macd.length);
    const histogram = new Array(macd.length);

    const emaSignal = this._calculateEMA(validMacd, signalPeriod);

    let emaIdx = 0;
    for (let i = 0; i < macd.length; i++) {
      if (macd[i] === null) {
        signal[i] = null;
        histogram[i] = null;
      } else {
        const sig = emaSignal[emaIdx];
        signal[i] = sig;
        histogram[i] = sig !== null ? macd[i] - sig : null;
        emaIdx++;
      }
    }

    return { macd, signal, histogram };
  }

  static _calculateEMA(prices, period) {
    if (!prices || prices.length === 0) return [];

    const ema = new Array(prices.length);
    const multiplier = 2 / (period + 1);

    let sum = 0;
    let count = 0;
    for (let i = 0; i < Math.min(period, prices.length); i++) {
      sum += prices[i];
      count++;
    }

    let currentEma = sum / count;
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        ema[i] = null;
      } else if (i === period - 1) {
        ema[i] = currentEma;
      } else {
        currentEma = prices[i] * multiplier + currentEma * (1 - multiplier);
        ema[i] = currentEma;
      }
    }

    return ema;
  }

  static calculateForecast(prices) {
    if (!prices || prices.length < 30) return [];

    const last30 = prices.slice(-30);
    const n = last30.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = last30.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = last30[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;

    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const xValue = n + i;
      const projectedPrice = slope * xValue + intercept;
      const boundedPrice = Math.max(
        last30[n - 1] * 0.8,
        Math.min(last30[n - 1] * 1.2, projectedPrice)
      );
      forecast.push(boundedPrice);
    }

    return forecast;
  }

  static calculateMathTarget(currentPrice, rsi, forecast) {
    if (!currentPrice || !forecast || forecast.length === 0) return currentPrice;

    const forecastAvg = forecast.reduce((a, b) => a + b, 0) / forecast.length;
    let rsiWeight = 0.5;

    if (rsi < 30) rsiWeight = 0.3;
    else if (rsi > 70) rsiWeight = 0.7;

    return currentPrice * (1 - rsiWeight) + forecastAvg * rsiWeight;
  }
}

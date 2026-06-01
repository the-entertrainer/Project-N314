import { describe, it, expect } from 'vitest';
import MathEngine from '../mathEngine';

describe('MathEngine', () => {
  describe('calculateRSI', () => {
    it('should return array of RSI values', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
      const rsi = MathEngine.calculateRSI(prices);
      expect(Array.isArray(rsi)).toBe(true);
      expect(rsi.length).toBe(30);
    });

    it('should return values between 0-100', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5);
      const rsi = MathEngine.calculateRSI(prices);
      rsi.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      });
    });

    it('should handle prices shorter than period', () => {
      const prices = [100, 101, 102];
      const rsi = MathEngine.calculateRSI(prices);
      expect(Array.isArray(rsi)).toBe(true);
      expect(rsi.length).toBe(3);
    });
  });

  describe('calculateATR', () => {
    it('should calculate ATR as single number', () => {
      const highs = Array.from({ length: 20 }, (_, i) => 105 + i);
      const lows = Array.from({ length: 20 }, (_, i) => 95 + i);
      const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
      const atr = MathEngine.calculateATR(highs, lows, closes);
      expect(typeof atr).toBe('number');
      expect(atr).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for insufficient data', () => {
      const atr = MathEngine.calculateATR([100], [99], [100]);
      expect(atr).toBe(0);
    });
  });

  describe('calculateSMA', () => {
    it('should return array of SMA values', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
      const sma = MathEngine.calculateSMA(prices, 20);
      expect(Array.isArray(sma)).toBe(true);
      expect(sma.length).toBe(50);
    });

    it('should return 0 for periods before calculation', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
      const sma = MathEngine.calculateSMA(prices, 20);
      for (let i = 0; i < 19; i++) {
        expect(sma[i]).toBe(0);
      }
    });
  });

  describe('calculateHistoricalVol', () => {
    it('should return positive volatility number', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
      const vol = MathEngine.calculateHistoricalVol(prices);
      expect(typeof vol).toBe('number');
      expect(vol).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for insufficient data', () => {
      const vol = MathEngine.calculateHistoricalVol([100, 101]);
      expect(vol).toBe(0);
    });
  });

  describe('calculateMACD', () => {
    it('should return MACD lines and histogram', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
      const macd = MathEngine.calculateMACD(prices);
      expect(macd).toHaveProperty('macdLine');
      expect(macd).toHaveProperty('signalLine');
      expect(macd).toHaveProperty('histogram');
      expect(Array.isArray(macd.macdLine)).toBe(true);
      expect(Array.isArray(macd.signalLine)).toBe(true);
      expect(Array.isArray(macd.histogram)).toBe(true);
    });
  });

  describe('detectMATrend', () => {
    it('should identify trend from moving averages', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
      const sma20 = MathEngine.calculateSMA(prices, 20);
      const sma50 = MathEngine.calculateSMA(prices, 50);
      const sma200 = MathEngine.calculateSMA(prices, 50); // Use 50 again for simplicity
      const trend = MathEngine.detectMATrend(sma20, sma50, sma200);
      expect(['UPTREND', 'DOWNTREND', 'SIDEWAYS', 'UNKNOWN']).toContain(trend);
    });
  });

  describe('calculateSupportsResistances', () => {
    it('should return support and resistance levels', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i) * 10);
      const levels = MathEngine.calculateSupportsResistances(prices);
      expect(levels).toHaveProperty('support1');
      expect(levels).toHaveProperty('support2');
      expect(levels).toHaveProperty('resistance1');
      expect(levels).toHaveProperty('resistance2');
      expect(typeof levels.support1).toBe('number');
      expect(typeof levels.resistance1).toBe('number');
    });
  });
});

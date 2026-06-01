import { describe, it, expect } from 'vitest';
import ScoringEngine from '../scoringEngine';
import type { Stock } from '@/types';

describe('ScoringEngine', () => {
  const mockStock: Stock = {
    ticker: 'SBIN.NS',
    name: 'State Bank of India',
    sector: 'Financials',
    cmp: 500,
    pe: 12,
    pb: 1.2,
    roe: 18,
    debtEquity: 0.5,
    profitMargin: 25,
    rsi: 55,
    maStatus: 'BULLISH',
    returnDaily: 1.5,
    returnMonthly: 5.2,
    marketCap: 500000000000,
    volume: 5000000,
    beta: 1.1,
    high52w: 520,
    low52w: 400,
    isFno: true,
    institutionalFlag: true,
    score: 0,
    grade: 'C',
    rawPrices: Array.from({ length: 30 }, (_, i) => 500 + Math.sin(i) * 20),
  };

  describe('scoreAll', () => {
    it('should return a Map of scores', () => {
      const stocksMap = new Map<string, Stock>([
        ['SBIN.NS', mockStock],
      ]);
      const scoreMap = ScoringEngine.scoreAll(stocksMap);
      expect(scoreMap instanceof Map).toBe(true);
      expect(scoreMap.has('SBIN.NS')).toBe(true);
    });

    it('should calculate numeric scores', () => {
      const stocksMap = new Map<string, Stock>([
        ['SBIN.NS', mockStock],
      ]);
      const scoreMap = ScoringEngine.scoreAll(stocksMap);
      const score = scoreMap.get('SBIN.NS');
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should score multiple stocks', () => {
      const stock2: Stock = { ...mockStock, ticker: 'INFY.NS', roe: 25, pe: 20 };
      const stocksMap = new Map<string, Stock>([
        ['SBIN.NS', mockStock],
        ['INFY.NS', stock2],
      ]);
      const scoreMap = ScoringEngine.scoreAll(stocksMap);
      expect(scoreMap.size).toBe(2);
      expect(scoreMap.has('SBIN.NS')).toBe(true);
      expect(scoreMap.has('INFY.NS')).toBe(true);
    });
  });

  describe('applyScoresToState', () => {
    it('should update stock scores in place', () => {
      const stocksMap = new Map<string, Stock>([
        ['SBIN.NS', { ...mockStock }],
      ]);
      const scoreMap = ScoringEngine.scoreAll(stocksMap);
      ScoringEngine.applyScoresToState(stocksMap, scoreMap);

      const updatedStock = stocksMap.get('SBIN.NS');
      expect(updatedStock?.score).toBeGreaterThanOrEqual(0);
      expect(updatedStock?.grade).toBeDefined();
    });

    it('should assign grades based on scores', () => {
      const stocksMap = new Map<string, Stock>([
        ['SBIN.NS', { ...mockStock }],
      ]);
      const scoreMap = ScoringEngine.scoreAll(stocksMap);
      ScoringEngine.applyScoresToState(stocksMap, scoreMap);

      const stock = stocksMap.get('SBIN.NS');
      expect(['A', 'B', 'C', 'D', 'F']).toContain(stock?.grade);
    });

    it('should ignore non-existent stocks', () => {
      const stocksMap = new Map<string, Stock>();
      const scoreMap = new Map<string, number>([
        ['NONEXISTENT.NS', 50],
      ]);
      expect(() => {
        ScoringEngine.applyScoresToState(stocksMap, scoreMap);
      }).not.toThrow();
    });
  });
});

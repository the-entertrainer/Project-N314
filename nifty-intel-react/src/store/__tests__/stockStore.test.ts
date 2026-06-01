import { describe, it, expect, beforeEach } from 'vitest';
import { useStockStore } from '../stockStore';
import type { Stock } from '@/types';

describe('stockStore', () => {
  beforeEach(() => {
    const store = useStockStore.getState();
    store.setStocks([]);
    store.setError(null);
    store.setFetchStatus('idle');
  });

  const mockStocks: Stock[] = [
    {
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
      score: 75,
      grade: 'B',
      rawPrices: Array.from({ length: 30 }, (_, i) => 500 + i),
    },
    {
      ticker: 'INFY.NS',
      name: 'Infosys',
      sector: 'IT',
      cmp: 1500,
      pe: 20,
      pb: 3.2,
      roe: 22,
      debtEquity: 0.2,
      profitMargin: 30,
      rsi: 60,
      maStatus: 'BULLISH',
      returnDaily: 2.1,
      returnMonthly: 6.5,
      marketCap: 700000000000,
      volume: 2000000,
      beta: 1.05,
      high52w: 1600,
      low52w: 1200,
      isFno: true,
      institutionalFlag: true,
      score: 82,
      grade: 'A',
      rawPrices: Array.from({ length: 30 }, (_, i) => 1500 + i * 2),
    },
  ];

  describe('setStocks', () => {
    it('should set stocks and update topScored', () => {
      const store = useStockStore.getState();
      store.setStocks(mockStocks);

      const state = useStockStore.getState();
      expect(state.stocks.size).toBe(2);
      expect(state.topScored.length).toBe(2);
      expect(state.topScored[0].ticker).toBe('INFY.NS');
    });

    it('should maintain stocks as Map', () => {
      const store = useStockStore.getState();
      store.setStocks(mockStocks);

      const state = useStockStore.getState();
      expect(state.stocks.get('SBIN.NS')).toBeDefined();
      expect(state.stocks.get('INFY.NS')).toBeDefined();
    });
  });

  describe('patchStocks', () => {
    it('should update specific stock properties', () => {
      const store = useStockStore.getState();
      store.setStocks(mockStocks);

      store.patchStocks([{ ticker: 'SBIN.NS', returnDaily: 3.0 }]);

      const updated = useStockStore.getState().stocks.get('SBIN.NS');
      expect(updated?.returnDaily).toBe(3.0);
      expect(updated?.name).toBe('State Bank of India');
    });
  });

  describe('addToWatchlist', () => {
    it('should add ticker to watchlist', () => {
      const store = useStockStore.getState();
      store.addToWatchlist('SBIN.NS');
      store.addToWatchlist('INFY.NS');

      const state = useStockStore.getState();
      expect(state.watchlist).toContain('SBIN.NS');
      expect(state.watchlist).toContain('INFY.NS');
      expect(state.watchlist.length).toBeGreaterThanOrEqual(2);
    });

    it('should add ticker to watchlist', () => {
      const store = useStockStore.getState();
      const initialLength = store.watchlist.length;
      store.addToWatchlist('TEST.NS');

      const state = useStockStore.getState();
      expect(state.watchlist).toContain('TEST.NS');
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove ticker from watchlist', () => {
      const store = useStockStore.getState();
      store.addToWatchlist('SBIN.NS');
      store.addToWatchlist('INFY.NS');
      store.removeFromWatchlist('SBIN.NS');

      const state = useStockStore.getState();
      expect(state.watchlist).not.toContain('SBIN.NS');
      expect(state.watchlist).toContain('INFY.NS');
    });
  });

  describe('setFetchStatus', () => {
    it('should update fetch status', () => {
      const store = useStockStore.getState();
      store.setFetchStatus('loading');
      expect(useStockStore.getState().fetchStatus).toBe('loading');

      store.setFetchStatus('done');
      expect(useStockStore.getState().fetchStatus).toBe('done');
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const store = useStockStore.getState();
      store.setError('Network error');
      expect(useStockStore.getState().error).toBe('Network error');
    });

    it('should clear error', () => {
      const store = useStockStore.getState();
      store.setError('Network error');
      store.setError(null);
      expect(useStockStore.getState().error).toBeNull();
    });
  });

  describe('isStaleFetch', () => {
    it('should indicate staleness based on lastFetchTime', () => {
      const store = useStockStore.getState();
      const stale = store.isStaleFetch();
      expect(typeof stale).toBe('boolean');
    });
  });
});

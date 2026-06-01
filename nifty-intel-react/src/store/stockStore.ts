import { create } from 'zustand';
import type { Stock, FnoPosition } from '@/types';

interface StockStore {
  stocks: Map<string, Stock>;
  topScored: Stock[];
  filteredStocks: Stock[];
  fetchStatus: 'idle' | 'loading' | 'done' | 'error';
  lastFetchTime: number | null;
  error: string | null;

  setStocks: (stocks: Stock[]) => void;
  patchStocks: (stocks: Partial<Stock>[]) => void;
  setFilteredStocks: (stocks: Stock[]) => void;
  setFetchStatus: (status: StockStore['fetchStatus']) => void;
  setError: (error: string | null) => void;
  isStaleFetch: (maxAgeMs?: number) => boolean;

  fnoPositions: FnoPosition[];
  addPosition: (pos: Omit<FnoPosition, 'id'>) => void;
  removePosition: (id: string) => void;

  watchlist: string[];
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;

  geminiKey: string;
  setGeminiKey: (key: string) => void;
}

export const useStockStore = create<StockStore>((set, get) => ({
  stocks: new Map(),
  topScored: [],
  filteredStocks: [],
  fetchStatus: 'idle',
  lastFetchTime: null,
  error: null,

  setStocks: (stocks) =>
    set({
      stocks: new Map(stocks.map((s) => [s.ticker, s])),
      topScored: [...stocks]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 100),
      lastFetchTime: Date.now(),
    }),

  patchStocks: (stocks) => {
    const current = get().stocks;
    stocks.forEach((s) => {
      if (s.ticker) {
        const existing = current.get(s.ticker);
        current.set(s.ticker, { ...existing, ...s });
      }
    });
    set({
      stocks: new Map(current),
      topScored: [...current.values()]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 100),
    });
  },

  setFilteredStocks: (stocks) => set({ filteredStocks: stocks }),
  setFetchStatus: (status) => set({ fetchStatus: status }),
  setError: (error) => set({ error }),

  isStaleFetch: (maxAgeMs = 15 * 60 * 1000) => {
    const lastFetch = get().lastFetchTime;
    if (!lastFetch) return true;
    return Date.now() - lastFetch > maxAgeMs;
  },

  fnoPositions: [],
  addPosition: (pos) =>
    set((state) => ({
      fnoPositions: [
        ...state.fnoPositions,
        { ...pos, id: Date.now().toString() },
      ],
    })),
  removePosition: (id) =>
    set((state) => ({
      fnoPositions: state.fnoPositions.filter((p) => p.id !== id),
    })),

  watchlist: [],
  addToWatchlist: (ticker) =>
    set((state) => ({
      watchlist: [...new Set([...state.watchlist, ticker])],
    })),
  removeFromWatchlist: (ticker) =>
    set((state) => ({
      watchlist: state.watchlist.filter((t) => t !== ticker),
    })),

  geminiKey: localStorage.getItem('gemini_key') || '',
  setGeminiKey: (key) => {
    localStorage.setItem('gemini_key', key);
    set({ geminiKey: key });
  },
}));

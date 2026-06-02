import { create } from 'zustand';
import type {
  StockQuote, AppDataStatus, ScreenerFilters, TabId,
  FnoData, FiiDiiFlow, NewsArticle, AdvisorOutput, IndexQuote, SourceStatus,
} from '../types';

interface AppStore {
  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Selected stock for Deep Dive
  selectedTicker: string | null;
  setSelectedTicker: (ticker: string | null) => void;

  // Stock universe (dynamic from NSE)
  universe: { ticker: string; name: string; sector: string; isFno: boolean }[];
  setUniverse: (u: AppStore['universe']) => void;

  // Live prices (progressively filled)
  quotes: Map<string, StockQuote>;
  patchQuotes: (batch: StockQuote[]) => void;

  // Index quotes
  indices: IndexQuote[];
  setIndices: (idx: IndexQuote[]) => void;

  // F&O data
  fnoData: Map<string, FnoData>;
  setFnoData: (data: FnoData[]) => void;

  // FII/DII
  fiiDii: FiiDiiFlow | null;
  setFiiDii: (flow: FiiDiiFlow) => void;

  // News
  news: NewsArticle[];
  setNews: (articles: NewsArticle[]) => void;

  // AI Advisor output
  advisor: AdvisorOutput | null;
  setAdvisor: (output: AdvisorOutput) => void;

  // Data source statuses
  dataStatus: AppDataStatus;
  setSourceStatus: (source: keyof AppDataStatus, status: SourceStatus) => void;

  // Screener filters
  filters: ScreenerFilters;
  setFilters: (partial: Partial<ScreenerFilters>) => void;

  // Computed helpers
  getSortedFilteredQuotes: () => StockQuote[];
  getTopScored: (n?: number) => StockQuote[];
  getTopMovers: (n?: number) => { gainers: StockQuote[]; losers: StockQuote[] };
}

const defaultFilters: ScreenerFilters = {
  search: '',
  sector: '',
  grade: '',
  fnoOnly: false,
  fnoFlagOnly: false,
  sortBy: 'score',
  sortDir: 'desc',
};

const defaultStatus: AppDataStatus = {
  universe: { status: 'idle' },
  prices:   { status: 'idle' },
  indices:  { status: 'idle' },
  fiiDii:   { status: 'idle' },
  fno:      { status: 'idle' },
  news:     { status: 'idle' },
};

export const useAppStore = create<AppStore>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedTicker: null,
  setSelectedTicker: (ticker) => set({ selectedTicker: ticker, activeTab: ticker ? 'deepdive' : get().activeTab }),

  universe: [],
  setUniverse: (universe) => set({ universe }),

  quotes: new Map(),
  patchQuotes: (batch) => {
    set((state) => {
      const next = new Map(state.quotes);
      for (const q of batch) next.set(q.ticker, q);
      return { quotes: next };
    });
  },

  indices: [],
  setIndices: (indices) => set({ indices }),

  fnoData: new Map(),
  setFnoData: (data) => set({ fnoData: new Map(data.map((d) => [d.symbol, d])) }),

  fiiDii: null,
  setFiiDii: (flow) => set({ fiiDii: flow }),

  news: [],
  setNews: (news) => set({ news }),

  advisor: null,
  setAdvisor: (advisor) => set({ advisor }),

  dataStatus: defaultStatus,
  setSourceStatus: (source, status) =>
    set((state) => ({
      dataStatus: { ...state.dataStatus, [source]: status },
    })),

  filters: defaultFilters,
  setFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),

  getSortedFilteredQuotes: () => {
    const { quotes, filters } = get();
    let list = [...quotes.values()];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    if (filters.sector) list = list.filter((s) => s.sector === filters.sector);
    if (filters.grade)  list = list.filter((s) => s.grade  === filters.grade);
    if (filters.fnoOnly)     list = list.filter((s) => s.isFno);
    if (filters.fnoFlagOnly) list = list.filter((s) => s.fnoFlag);

    const key = filters.sortBy as keyof StockQuote;
    list.sort((a, b) => {
      const av = (a[key] as number) ?? -Infinity;
      const bv = (b[key] as number) ?? -Infinity;
      return filters.sortDir === 'asc' ? av - bv : bv - av;
    });

    return list;
  },

  getTopScored: (n = 50) => {
    const list = [...get().quotes.values()];
    return list
      .filter((s) => s.score !== undefined)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, n);
  },

  getTopMovers: (n = 5) => {
    const list = [...get().quotes.values()].filter((s) => s.changePct !== undefined);
    const sorted = [...list].sort((a, b) => b.changePct - a.changePct);
    return { gainers: sorted.slice(0, n), losers: sorted.slice(-n).reverse() };
  },
}));

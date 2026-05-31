const STORAGE_KEYS = {
  positions: 'niftyintel_positions',
  watchlist: 'niftyintel_watchlist',
  longTerm: 'niftyintel_longterm',
  postLog: 'niftyintel_postlog',
  geminiKey: 'niftyintel_gemini_key',
};

class StateManager {
  constructor() {
    this.stocks = new Map();
    this.niftyData = null;
    this.fnoPositions = [];
    this.watchlist = [];
    this.longTermList = [];
    this.postMarketLog = [];
    this.lastFetchTimestamp = null;
    this.fetchStatus = 'idle';
    this._listeners = new Map();
  }

  loadFromStorage() {
    try {
      const pos = localStorage.getItem(STORAGE_KEYS.positions);
      if (pos) this.fnoPositions = JSON.parse(pos);
      const wl = localStorage.getItem(STORAGE_KEYS.watchlist);
      if (wl) this.watchlist = JSON.parse(wl);
      const lt = localStorage.getItem(STORAGE_KEYS.longTerm);
      if (lt) this.longTermList = JSON.parse(lt);
      const pl = localStorage.getItem(STORAGE_KEYS.postLog);
      if (pl) this.postMarketLog = JSON.parse(pl);
    } catch (e) {
      console.warn('State load error:', e);
    }
  }

  _emit(key, data) {
    document.dispatchEvent(new CustomEvent('statechange', { detail: { key, data } }));
  }

  setStockData(ticker, record) {
    this.stocks.set(ticker, { ...this.stocks.get(ticker), ...record });
    this._emit('stocks', ticker);
  }

  setAllStocks(stocksArray) {
    this.stocks.clear();
    for (const s of stocksArray) this.stocks.set(s.ticker, s);
    this.lastFetchTimestamp = Date.now();
    this._emit('stocks_all', null);
  }

  setNiftyData(data) {
    this.niftyData = data;
    this._emit('niftyData', data);
  }

  setFetchStatus(status) {
    this.fetchStatus = status;
    this._emit('fetchStatus', status);
  }

  addFnoPosition(position) {
    this.fnoPositions.push({ ...position, id: Date.now().toString() });
    this._persist(STORAGE_KEYS.positions, this.fnoPositions);
    this._emit('fnoPositions', null);
  }

  removeFnoPosition(id) {
    this.fnoPositions = this.fnoPositions.filter(p => p.id !== id);
    this._persist(STORAGE_KEYS.positions, this.fnoPositions);
    this._emit('fnoPositions', null);
  }

  updateFnoPosition(id, updates) {
    const idx = this.fnoPositions.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.fnoPositions[idx] = { ...this.fnoPositions[idx], ...updates };
      this._persist(STORAGE_KEYS.positions, this.fnoPositions);
      this._emit('fnoPositions', null);
    }
  }

  addToWatchlist(entry) {
    if (!this.watchlist.find(w => w.ticker === entry.ticker)) {
      this.watchlist.push(entry);
      this._persist(STORAGE_KEYS.watchlist, this.watchlist);
      this._emit('watchlist', null);
    }
  }

  removeFromWatchlist(ticker) {
    this.watchlist = this.watchlist.filter(w => w.ticker !== ticker);
    this._persist(STORAGE_KEYS.watchlist, this.watchlist);
    this._emit('watchlist', null);
  }

  setLongTermList(list) {
    this.longTermList = list;
    this._persist(STORAGE_KEYS.longTerm, list);
    this._emit('longTermList', null);
  }

  addPostMarketEntry(entry) {
    this.postMarketLog.unshift({ ...entry, timestamp: Date.now() });
    if (this.postMarketLog.length > 60) this.postMarketLog.pop();
    this._persist(STORAGE_KEYS.postLog, this.postMarketLog);
    this._emit('postMarketLog', null);
  }

  getGeminiKey() {
    return localStorage.getItem(STORAGE_KEYS.geminiKey) || '';
  }

  setGeminiKey(key) {
    localStorage.setItem(STORAGE_KEYS.geminiKey, key);
  }

  getStocksSortedByScore() {
    return [...this.stocks.values()].sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  getTopN(n) {
    return this.getStocksSortedByScore().slice(0, n);
  }

  isStaleFetch(maxAgeMs = 15 * 60 * 1000) {
    if (!this.lastFetchTimestamp) return true;
    return Date.now() - this.lastFetchTimestamp > maxAgeMs;
  }

  _persist(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage write failed:', e);
    }
  }
}

export const State = new StateManager();
export default State;

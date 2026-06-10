import registry from '../data/nifty500.json';
import type { Nifty500Stock } from '../types/screener';

const STOCKS = registry as Nifty500Stock[];

const bySymbol = new Map(STOCKS.map((s) => [s.symbol, s]));

export function getNifty500Registry(): Nifty500Stock[] {
  return STOCKS;
}

export function getStockBySymbol(symbol: string): Nifty500Stock | undefined {
  const normalized = symbol.toUpperCase().includes('.NS') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
  return bySymbol.get(normalized);
}

export function searchRegistry(query: string, limit = 100): Nifty500Stock[] {
  const q = query.toLowerCase().trim();
  if (!q) return STOCKS;
  return STOCKS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(q) ||
      s.companyName.toLowerCase().includes(q) ||
      s.industry.toLowerCase().includes(q)
  ).slice(0, limit);
}
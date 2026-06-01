import { useState, useCallback, useMemo } from 'react';
import { useStockStore } from '@/store/stockStore';
import type { Stock } from '@/types';

export interface ScreenerFilters {
  sector: string;
  grade: string;
  fnoOnly: boolean;
  instOnly: boolean;
  search: string;
  sortKey: string;
  sortDir: number;
}

export function useScreenerFilters() {
  const stocks = useStockStore((state) => state.stocks);
  const setFilteredStocks = useStockStore((state) => state.setFilteredStocks);

  const [filters, setFilters] = useState<ScreenerFilters>({
    sector: 'all',
    grade: 'all',
    fnoOnly: false,
    instOnly: false,
    search: '',
    sortKey: 'score',
    sortDir: -1,
  });

  const applyFilters = useCallback(
    (newFilters?: Partial<ScreenerFilters>) => {
      const currentFilters = newFilters
        ? { ...filters, ...newFilters }
        : filters;

      let filtered = [...stocks.values()];

      if (currentFilters.sector !== 'all') {
        filtered = filtered.filter((s) => s.sector === currentFilters.sector);
      }

      if (currentFilters.grade !== 'all') {
        filtered = filtered.filter((s) => s.grade === currentFilters.grade);
      }

      if (currentFilters.fnoOnly) {
        filtered = filtered.filter((s) => s.isFno);
      }

      if (currentFilters.instOnly) {
        filtered = filtered.filter((s) => s.institutionalFlag);
      }

      if (currentFilters.search) {
        const q = currentFilters.search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.ticker?.toLowerCase().includes(q) ||
            s.name?.toLowerCase().includes(q)
        );
      }

      // Sorting
      filtered.sort((a, b) => {
        const aVal = a[currentFilters.sortKey as keyof Stock] || 0;
        const bVal = b[currentFilters.sortKey as keyof Stock] || 0;
        const cmp =
          typeof aVal === 'number' && typeof bVal === 'number'
            ? aVal < bVal
              ? -1
              : 1
            : String(aVal).localeCompare(String(bVal));
        return currentFilters.sortDir * cmp;
      });

      setFilteredStocks(filtered);
      if (newFilters) setFilters(currentFilters);
    },
    [stocks, filters, setFilteredStocks]
  );

  const updateFilter = useCallback(
    (key: keyof ScreenerFilters, value: any) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      applyFilters(newFilters);
    },
    [filters, applyFilters]
  );

  const updateSort = useCallback(
    (key: string) => {
      const newSortDir =
        filters.sortKey === key ? -filters.sortDir : -1;
      updateFilter('sortKey', key);
      updateFilter('sortDir', newSortDir);
    },
    [filters.sortKey, filters.sortDir, updateFilter]
  );

  const sectors = useMemo(() => {
    return [...new Set([...stocks.values()].map((s) => s.sector))].sort();
  }, [stocks]);

  return {
    filters,
    applyFilters,
    updateFilter,
    updateSort,
    sectors,
  };
}

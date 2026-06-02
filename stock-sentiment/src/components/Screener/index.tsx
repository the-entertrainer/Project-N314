import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppStore } from '../../store/appStore';
import { fmtPrice, fmtPct, fmtMktCap, fmtNum } from '../../utils/formatters';
import type { StockQuote } from '../../types';

const GRADE_COLOR: Record<string, string> = {
  A: 'text-teal-300 bg-teal-500/10 border-teal-500/30',
  B: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  C: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
  D: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
  F: 'text-red-300 bg-red-500/10 border-red-500/30',
};

const COLS = [
  { key: 'stock',     label: 'Stock',     flex: '0 0 140px', sortKey: 'ticker'    as keyof StockQuote },
  { key: 'price',     label: 'CMP',       flex: '0 0 90px',  sortKey: 'price'     as keyof StockQuote },
  { key: 'changePct', label: 'Chg %',     flex: '0 0 80px',  sortKey: 'changePct' as keyof StockQuote },
  { key: 'high52w',   label: '52W H/L',   flex: '1 1 140px', sortKey: undefined },
  { key: 'marketCap', label: 'Mkt Cap',   flex: '0 0 80px',  sortKey: 'marketCap' as keyof StockQuote },
  { key: 'pe',        label: 'P/E',       flex: '0 0 60px',  sortKey: 'pe'        as keyof StockQuote },
  { key: 'rsi14',     label: 'RSI',       flex: '0 0 60px',  sortKey: 'rsi14'     as keyof StockQuote },
  { key: 'score',     label: 'Score',     flex: '0 0 90px',  sortKey: 'score'     as keyof StockQuote },
  { key: 'flag',      label: 'Flag',      flex: '0 0 70px',  sortKey: undefined },
];

const HeaderRow: React.FC = () => {
  const filters    = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);

  return (
    <div className="flex items-center px-3 py-2 sticky top-0 glass z-20 border-b border-white/8 min-w-[700px]">
      {COLS.map((col) => {
        const active = filters.sortBy === col.sortKey;
        return (
          <div
            key={col.key}
            className={`text-xs font-mono text-white/40 uppercase tracking-wider select-none ${col.sortKey ? 'cursor-pointer hover:text-white/70' : ''}`}
            style={{ flex: col.flex, minWidth: 0 }}
            onClick={() => {
              if (!col.sortKey) return;
              setFilters({
                sortBy:  col.sortKey,
                sortDir: active && filters.sortDir === 'desc' ? 'asc' : 'desc',
              });
            }}
          >
            {col.label}
            {col.sortKey && (
              <svg
                className={`w-3 h-3 inline ml-0.5 ${active ? 'text-teal-400' : 'text-white/15'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                {active && filters.sortDir === 'asc'
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />}
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};

const StockRow: React.FC<{ stock: StockQuote; style: React.CSSProperties; onClick: () => void }> = ({ stock: s, style, onClick }) => {
  const pos = s.changePct >= 0;
  return (
    <div
      className="flex items-center px-3 border-b border-white/4 hover:bg-white/5 cursor-pointer transition-colors min-w-[700px]"
      style={style}
      onClick={onClick}
    >
      {/* Stock */}
      <div style={{ flex: '0 0 140px', minWidth: 0 }}>
        <p className="text-xs font-bold text-white truncate">{s.ticker}</p>
        <p className="text-xs text-white/35 truncate">{s.name}</p>
      </div>
      {/* CMP */}
      <div style={{ flex: '0 0 90px', minWidth: 0 }}>
        <span className="text-xs font-mono text-white">{fmtPrice(s.price)}</span>
      </div>
      {/* Chg% */}
      <div style={{ flex: '0 0 80px', minWidth: 0 }}>
        <span className={`text-xs font-mono font-semibold ${pos ? 'text-teal-400' : 'text-red-400'}`}>{fmtPct(s.changePct)}</span>
      </div>
      {/* 52W H/L */}
      <div style={{ flex: '1 1 140px', minWidth: 0 }}>
        <span className="text-xs font-mono text-teal-300/60">{fmtPrice(s.high52w)}</span>
        <span className="text-white/20 text-xs"> / </span>
        <span className="text-xs font-mono text-red-300/60">{fmtPrice(s.low52w)}</span>
      </div>
      {/* Mkt Cap */}
      <div style={{ flex: '0 0 80px', minWidth: 0 }}>
        <span className="text-xs font-mono text-white/50">{fmtMktCap(s.marketCap)}</span>
      </div>
      {/* P/E */}
      <div style={{ flex: '0 0 60px', minWidth: 0 }}>
        <span className="text-xs font-mono text-white/50">{s.pe != null ? fmtNum(s.pe, 1) : '—'}</span>
      </div>
      {/* RSI */}
      <div style={{ flex: '0 0 60px', minWidth: 0 }}>
        <span className={`text-xs font-mono ${s.rsi14 != null ? (s.rsi14 > 70 ? 'text-red-400' : s.rsi14 < 30 ? 'text-teal-400' : 'text-white/50') : 'text-white/25'}`}>
          {s.rsi14 != null ? fmtNum(s.rsi14, 0) : '—'}
        </span>
      </div>
      {/* Score + Grade */}
      <div style={{ flex: '0 0 90px', minWidth: 0 }} className="flex items-center gap-1">
        <span className="text-xs font-bold text-white font-mono">{s.score ?? '—'}</span>
        {s.grade && (
          <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${GRADE_COLOR[s.grade] ?? ''}`}>
            {s.grade}
          </span>
        )}
      </div>
      {/* Flag */}
      <div style={{ flex: '0 0 70px', minWidth: 0 }}>
        {s.fnoFlag
          ? <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-mono">FLAG</span>
          : s.isFno
          ? <span className="text-xs text-white/20 font-mono">F&O</span>
          : null}
      </div>
    </div>
  );
};

const FilterBar: React.FC = () => {
  const filters    = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const universe   = useAppStore((s) => s.universe);

  const sectors = useMemo(() => {
    const all = new Set(universe.map((u) => u.sector).filter(Boolean));
    return Array.from(all).sort();
  }, [universe.length]);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 border-b border-white/5">
      <input
        type="text"
        placeholder="Search ticker or name..."
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        className="h-8 px-3 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-teal-500/50 w-44"
      />
      <select
        value={filters.sector}
        onChange={(e) => setFilters({ sector: e.target.value })}
        className="h-8 px-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white/70 focus:outline-none focus:border-teal-500/50"
      >
        <option value="">All Sectors</option>
        {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select
        value={filters.grade}
        onChange={(e) => setFilters({ grade: e.target.value })}
        className="h-8 px-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white/70 focus:outline-none focus:border-teal-500/50"
      >
        <option value="">All Grades</option>
        {['A', 'B', 'C', 'D', 'F'].map((g) => <option key={g} value={g}>Grade {g}</option>)}
      </select>
      <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer select-none">
        <input type="checkbox" checked={filters.fnoOnly} onChange={(e) => setFilters({ fnoOnly: e.target.checked })} className="accent-teal-400" />
        F&O Only
      </label>
      <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer select-none">
        <input type="checkbox" checked={filters.fnoFlagOnly} onChange={(e) => setFilters({ fnoFlagOnly: e.target.checked })} className="accent-violet-400" />
        Smart Money
      </label>
      <button
        onClick={() => setFilters({ search: '', sector: '', grade: '', fnoOnly: false, fnoFlagOnly: false })}
        className="h-8 px-3 text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-lg transition-colors"
      >
        Clear
      </button>
    </div>
  );
};

const Screener: React.FC = () => {
  const [subTab, setSubTab] = React.useState<'all' | 'top50'>('all');
  const getSortedFilteredQuotes = useAppStore((s) => s.getSortedFilteredQuotes);
  const getTopScored            = useAppStore((s) => s.getTopScored);
  const setSelectedTicker       = useAppStore((s) => s.setSelectedTicker);
  const quoteCount              = useAppStore((s) => s.quotes.size);
  const filters                 = useAppStore((s) => s.filters);

  const rows = useMemo(
    () => subTab === 'top50' ? getTopScored(50) : getSortedFilteredQuotes(),
    [quoteCount, subTab, filters]
  );

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count:            rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize:     () => 52,
    overscan:         12,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex gap-1">
          {(['all', 'top50'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSubTab(t)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                subTab === t
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'all' ? `All Stocks (${quoteCount})` : 'Top 50 by Score'}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/25 font-mono">{rows.length} results</p>
      </div>

      {subTab === 'all' && <FilterBar />}

      {/* Header row */}
      <div className="overflow-auto" style={{ overflowY: 'hidden' }}>
        <HeaderRow />
      </div>

      {/* Virtual rows */}
      <div ref={parentRef} className="overflow-auto flex-1" style={{ minHeight: 0 }}>
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative', minWidth: '700px' }}>
          {virtualizer.getVirtualItems().map((vRow) => {
            const stock = rows[vRow.index];
            if (!stock) return null;
            return (
              <StockRow
                key={stock.ticker}
                stock={stock}
                onClick={() => setSelectedTicker(stock.ticker)}
                style={{
                  position:  'absolute',
                  top:       0,
                  left:      0,
                  width:     '100%',
                  height:    `${vRow.size}px`,
                  transform: `translateY(${vRow.start}px)`,
                }}
              />
            );
          })}
        </div>
        {rows.length === 0 && (
          <div className="flex items-center justify-center h-40 text-white/30 text-sm">
            {quoteCount === 0 ? 'Loading stocks...' : 'No stocks match your filters'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Screener;

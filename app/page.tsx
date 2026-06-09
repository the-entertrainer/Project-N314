'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import type { MarketQuote } from '../types/market';

const columnHelper = createColumnHelper<MarketQuote>();

export default function N314() {
  const [activeTab, setActiveTab] = useState<'overview' | 'screener' | 'ai'>('overview');
  const [marketData, setMarketData] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const fetchMarketData = async (type: string = 'indices') => {
    try {
      const res = await fetch(`/api/market?type=${type}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMarketData(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') fetchMarketData('indices');
    if (activeTab === 'screener') fetchMarketData('popular');
  }, [activeTab]);

  // Columns for Screener
  const columns = useMemo(
    () => [
      columnHelper.accessor('symbol', {
        header: 'Symbol',
        cell: (info) => <span className="font-mono font-semibold">{info.getValue()}</span>,
      }),
      columnHelper.accessor('shortName', {
        header: 'Name',
        cell: (info) => info.getValue() || '—',
      }),
      columnHelper.accessor('regularMarketPrice', {
        header: 'Price',
        cell: (info) => info.getValue()?.toLocaleString('en-IN') || '—',
      }),
      columnHelper.accessor('regularMarketChangePercent', {
        header: 'Change %',
        cell: (info) => {
          const val = info.getValue();
          if (val === undefined) return '—';
          const isPositive = val >= 0;
          return (
            <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
              {isPositive ? '+' : ''}{val.toFixed(2)}%
            </span>
          );
        },
      }),
      columnHelper.accessor('regularMarketVolume', {
        header: 'Volume',
        cell: (info) => (info.getValue() ? (info.getValue()! / 1_000_000).toFixed(1) + 'M' : '—'),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: marketData,
    columns,
    state: { globalFilter, sorting },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center font-bold text-xl text-black">N</div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tighter">N314</h1>
              <p className="text-xs text-zinc-500 -mt-1">STOCK INTELLIGENCE</p>
            </div>
          </div>
          <nav className="flex gap-2 text-sm font-medium">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Overview</button>
            <button onClick={() => setActiveTab('screener')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'screener' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Screener</button>
            <button onClick={() => setActiveTab('ai')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'ai' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>AI Insights</button>
          </nav>
          <div className="text-xs px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            LIVE
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-5xl font-semibold tracking-tight mb-8">Market Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {marketData.length > 0 ? marketData.map((quote, i) => {
                const isPositive = (quote.regularMarketChangePercent || 0) >= 0;
                return (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                    <div className="text-sm text-zinc-500">{quote.symbol.replace('^', '')}</div>
                    <div className="text-4xl font-mono mt-3">{quote.regularMarketPrice?.toLocaleString('en-IN')}</div>
                    <div className={`mt-2 text-lg ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(quote.regularMarketChangePercent || 0) >= 0 ? '+' : ''}{quote.regularMarketChangePercent?.toFixed(2)}%
                    </div>
                  </div>
                );
              }) : <div className="col-span-4 text-center py-12 text-zinc-400">Loading...</div>}
            </div>
          </div>
        )}

        {activeTab === 'screener' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-4xl font-semibold tracking-tight">Stock Screener</h2>
              <input
                type="text"
                placeholder="Search stocks..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 w-80 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {loading ? (
              <div className="text-center py-20 text-zinc-400">Loading stocks...</div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-950 border-b border-zinc-800">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            className="px-6 py-4 text-left text-sm font-medium text-zinc-400 cursor-pointer select-none"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: ' ↑',
                              desc: ' ↓',
                            }[header.column.getIsSorted() as string] ?? null}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-6 py-4 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && <div className="text-center py-20 text-zinc-400">Gemini AI coming in next step</div>}
      </main>
    </div>
  );
}

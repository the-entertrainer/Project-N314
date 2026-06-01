import React, { useState } from 'react';
import { Sparkline } from '@/components/Common';
import { StockModal } from './StockModal';
import type { Stock } from '@/types';

interface ScreenerTableProps {
  stocks: Stock[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDir?: number;
}

export function ScreenerTable({
  stocks,
  onSort,
  sortKey = 'score',
  sortDir = -1,
}: ScreenerTableProps) {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRowClick = (stock: Stock) => {
    setSelectedStock(stock);
    setModalOpen(true);
  };

  const handleSort = (key: string) => {
    if (onSort) onSort(key);
  };

  const gradeColor = {
    A: 'bg-green-100 text-green-800',
    B: 'bg-blue-100 text-blue-800',
    C: 'bg-yellow-100 text-yellow-800',
    D: 'bg-orange-100 text-orange-800',
    F: 'bg-red-100 text-red-800',
  };

  if (stocks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No stocks match your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 w-12">
                  #
                </th>
                <th
                  onClick={() => handleSort('ticker')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                >
                  Stock {sortKey === 'ticker' && (sortDir > 0 ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 w-20">
                  Chart
                </th>
                <th
                  onClick={() => handleSort('cmp')}
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 w-20"
                >
                  Price {sortKey === 'cmp' && (sortDir > 0 ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('score')}
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 w-16"
                >
                  Score {sortKey === 'score' && (sortDir > 0 ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('grade')}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 w-12"
                >
                  Grade {sortKey === 'grade' && (sortDir > 0 ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('rsi')}
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 w-16"
                >
                  RSI {sortKey === 'rsi' && (sortDir > 0 ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 w-16">
                  Trend
                </th>
                <th
                  onClick={() => handleSort('pe')}
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 w-14"
                >
                  P/E {sortKey === 'pe' && (sortDir > 0 ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('returnMonthly')}
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 w-16"
                >
                  1M% {sortKey === 'returnMonthly' && (sortDir > 0 ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 w-12">
                  F&O
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 w-12">
                  Inst
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stocks.map((stock, index) => (
                <tr
                  key={stock.ticker}
                  onClick={() => handleRowClick(stock)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {stock.ticker.replace('.NS', '')}
                      </p>
                      <p className="text-xs text-gray-600">{stock.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {stock.rawPrices && stock.rawPrices.length > 0 ? (
                      <Sparkline
                        prices={stock.rawPrices}
                        width={80}
                        height={30}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    ₹{stock.cmp?.toFixed(2) || '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                    {stock.score || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${gradeColor[stock.grade || 'C']}`}
                    >
                      {stock.grade || 'C'}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-sm font-semibold ${
                      (stock.rsi || 0) > 70
                        ? 'text-red-600'
                        : (stock.rsi || 0) < 30
                          ? 'text-green-600'
                          : 'text-gray-900'
                    }`}
                  >
                    {stock.rsi?.toFixed(1) || '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                    {stock.trend?.charAt(0) === 'U' ? '↑' : stock.trend?.charAt(0) === 'D' ? '↓' : '→'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {stock.pe?.toFixed(1) || '—'}
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-sm font-semibold ${
                      (stock.returnMonthly || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {stock.returnMonthly?.toFixed(2) || '—'}%
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {stock.isFno ? '✓' : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {stock.institutionalFlag ? '✓' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <StockModal
        stock={selectedStock}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setTimeout(() => setSelectedStock(null), 300);
        }}
      />
    </>
  );
}

export default ScreenerTable;

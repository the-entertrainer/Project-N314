import React, { useMemo } from 'react';
import { useStockStore } from '@/store/stockStore';
import RationaleEngine from '@/utils/rationaleEngine';
import type { Stock } from '@/types';

export function PicksList() {
  const stocks = useStockStore((state) => state.stocks);

  const picks = useMemo(() => {
    const filtered: Stock[] = [];

    for (const stock of stocks.values()) {
      // Filter by fundamental criteria
      const roe = stock.roe || 0;
      const debtEquity = stock.debtEquity ?? 2;
      const pe = stock.pe || 100;
      const pb = stock.pb || 10;

      if (roe > 15 && debtEquity < 1 && pe < 25 && pb < 5) {
        filtered.push(stock);
      }
    }

    return filtered
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 100);
  }, [stocks]);

  const gradeColor = {
    A: 'bg-green-100 text-green-800',
    B: 'bg-blue-100 text-blue-800',
    C: 'bg-yellow-100 text-yellow-800',
    D: 'bg-orange-100 text-orange-800',
    F: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Criteria Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          Filtering Criteria
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-blue-700">ROE</p>
            <p className="font-bold text-blue-900">&gt; 15%</p>
          </div>
          <div>
            <p className="text-blue-700">Debt/Equity</p>
            <p className="font-bold text-blue-900">&lt; 1.0</p>
          </div>
          <div>
            <p className="text-blue-700">P/E</p>
            <p className="font-bold text-blue-900">&lt; 25</p>
          </div>
          <div>
            <p className="text-blue-700">P/B</p>
            <p className="font-bold text-blue-900">&lt; 5</p>
          </div>
        </div>
      </div>

      {/* Picks Grid */}
      {picks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {picks.map((stock) => {
            const rationale = stock.rationale ||
              RationaleEngine.buildLongTermRationale(stock);

            return (
              <div
                key={stock.ticker}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      {stock.sector}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900">
                      {stock.ticker.replace('.NS', '')}
                    </h3>
                    <p className="text-xs text-gray-500">{stock.name}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      gradeColor[stock.grade || 'C']
                    }`}
                  >
                    {stock.grade || 'C'}
                  </span>
                </div>

                {/* Price & Returns */}
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <p className="text-sm text-gray-600">Current Price</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{stock.cmp?.toFixed(2) || 'N/A'}
                  </p>
                  <p
                    className={`text-sm font-semibold mt-1 ${
                      (stock.returnMonthly || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    1M: {stock.returnMonthly?.toFixed(2) || '0.00'}%
                  </p>
                </div>

                {/* Fundamentals */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ROE</span>
                    <span className="font-semibold text-gray-900">
                      {stock.roe?.toFixed(1) || 'N/A'}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">D/E</span>
                    <span className="font-semibold text-gray-900">
                      {stock.debtEquity?.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">P/E</span>
                    <span className="font-semibold text-gray-900">
                      {stock.pe?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Margin</span>
                    <span className="font-semibold text-gray-900">
                      {stock.profitMargin?.toFixed(1) || 'N/A'}%
                    </span>
                  </div>
                </div>

                {/* Rationale */}
                {rationale.recommendationBasis && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-600 mb-2">
                      {rationale.recommendationBasis}
                    </p>
                    {rationale.fundamentalSignals && (
                      <ul className="text-xs space-y-1">
                        {rationale.fundamentalSignals.slice(0, 2).map((signal, i) => (
                          <li key={i} className="text-gray-700">
                            • {signal}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">
            No stocks meet the long-term criteria yet
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Loading data will populate this list with fundamental picks
          </p>
        </div>
      )}

      {/* Summary */}
      {picks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-2">
            Found {picks.length} of 500 stocks meeting fundamental criteria
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Avg ROE</p>
              <p className="font-bold text-gray-900">
                {(
                  picks.reduce((sum, s) => sum + (s.roe || 0), 0) /
                  picks.length
                ).toFixed(1)}
                %
              </p>
            </div>
            <div>
              <p className="text-gray-600">Avg D/E</p>
              <p className="font-bold text-gray-900">
                {(
                  picks.reduce((sum, s) => sum + (s.debtEquity || 0), 0) /
                  picks.length
                ).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Avg Score</p>
              <p className="font-bold text-gray-900">
                {(
                  picks.reduce((sum, s) => sum + (s.score || 0), 0) /
                  picks.length
                ).toFixed(0)}
                /100
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PicksList;

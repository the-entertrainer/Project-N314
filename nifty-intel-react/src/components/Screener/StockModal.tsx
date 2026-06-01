import React, { useState, useEffect } from 'react';
import { Modal, PriceChart, LoadingSpinner } from '@/components/Common';
import YahooService from '@/services/yahooService';
import MathEngine from '@/utils/mathEngine';
import RationaleEngine from '@/utils/rationaleEngine';
import type { Stock, HistoryData } from '@/types';

interface StockModalProps {
  stock: Stock | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StockModal({ stock, isOpen, onClose }: StockModalProps) {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stock && isOpen && !stock.rawPrices?.length) {
      setLoading(true);
      YahooService.fetchStockHistory(stock.ticker)
        .then((data) => {
          setHistoryData(data);
          if (data) {
            const rsi = MathEngine.calculateRSI(data.prices);
            stock.rsi = rsi[rsi.length - 1];
          }
        })
        .catch((e) => console.error('Failed to fetch history:', e))
        .finally(() => setLoading(false));
    }
  }, [stock, isOpen]);

  if (!stock) return null;

  const rationale = stock.rationale || RationaleEngine.buildStockRationale(stock);
  const chartPrices = historyData?.prices || stock.rawPrices || [];
  const chartDates = historyData?.dates || stock.rawDates || [];

  const gradeColor = {
    A: 'bg-green-100 text-green-800',
    B: 'bg-blue-100 text-blue-800',
    C: 'bg-yellow-100 text-yellow-800',
    D: 'bg-orange-100 text-orange-800',
    F: 'bg-red-100 text-red-800',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${stock.name} (${stock.ticker.replace('.NS', '')})`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="flex flex-wrap gap-4 items-center pb-4 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600">Current Price</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{stock.cmp?.toFixed(2) || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Daily Change</p>
            <p
              className={`text-lg font-semibold ${
                (stock.returnDaily || 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {stock.returnDaily?.toFixed(2) || '0.00'}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-2xl font-bold text-gray-900">
              {stock.score}/100
            </p>
          </div>
          <div className={`px-3 py-2 rounded-lg font-bold ${gradeColor[stock.grade || 'C']}`}>
            Grade: {stock.grade || 'C'}
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner message="Loading price history..." size="md" />
          </div>
        ) : chartPrices.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <PriceChart
              prices={chartPrices}
              dates={chartDates}
              height={300}
              title="1-Year Price History"
            />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No chart data available</p>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Key Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'RSI', value: stock.rsi?.toFixed(1) },
              { label: 'P/E', value: stock.pe?.toFixed(1) },
              { label: 'ROE', value: stock.roe ? `${stock.roe.toFixed(1)}%` : null },
              { label: 'D/E', value: stock.debtEquity?.toFixed(2) },
              { label: 'Margin', value: stock.profitMargin ? `${stock.profitMargin.toFixed(1)}%` : null },
              { label: 'Beta', value: stock.beta?.toFixed(2) },
              { label: '52W High', value: `₹${stock.high52w?.toFixed(0)}` },
              { label: '52W Low', value: `₹${stock.low52w?.toFixed(0)}` },
              {
                label: 'Mkt Cap',
                value:
                  stock.marketCap && stock.marketCap > 0
                    ? `₹${(stock.marketCap / 1e9).toFixed(1)}B`
                    : 'N/A',
              },
            ].map(
              ({ label, value }) =>
                value && (
                  <div
                    key={label}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <p className="text-xs text-gray-600 font-semibold">
                      {label}
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {value}
                    </p>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Recommendation Basis */}
        {rationale.recommendationBasis && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-900 mb-1">
              Recommendation
            </p>
            <p className="text-sm text-green-800">
              {rationale.recommendationBasis}
            </p>
          </div>
        )}

        {/* Technical & Fundamental Signals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rationale.technicalSignals && rationale.technicalSignals.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-900 uppercase mb-2">
                Technical Signals
              </h4>
              <ul className="space-y-1">
                {rationale.technicalSignals.map((signal, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    • {signal}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rationale.fundamentalSignals && rationale.fundamentalSignals.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-900 uppercase mb-2">
                Fundamental Signals
              </h4>
              <ul className="space-y-1">
                {rationale.fundamentalSignals.map((signal, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    • {signal}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Risks */}
        {rationale.risks && rationale.risks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-red-900 uppercase mb-2">
              Key Risks
            </h4>
            <ul className="space-y-1">
              {rationale.risks.map((risk, i) => (
                <li key={i} className="text-sm text-red-700">
                  ⚠ {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Sector</p>
              <p className="font-semibold text-gray-900">{stock.sector}</p>
            </div>
            <div>
              <p className="text-gray-600">F&O Status</p>
              <p className="font-semibold text-gray-900">
                {stock.isFno ? '✓ Active' : '✗ Inactive'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Institutional Holding</p>
              <p className="font-semibold text-gray-900">
                {stock.institutionalFlag ? '✓ Present' : '✗ Not Present'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Trend</p>
              <p className="font-semibold text-gray-900">
                {stock.trend || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default StockModal;

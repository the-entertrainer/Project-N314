import React, { useMemo, useState } from 'react';
import { useStockStore } from '@/store/stockStore';

export function PostMarketSummary() {
  const stocks = useStockStore((state) => state.stocks);
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    const stockArray = [...stocks.values()];
    if (stockArray.length === 0) return null;

    const gainers = stockArray
      .filter((s) => (s.returnDaily || 0) > 0)
      .sort((a, b) => (b.returnDaily || 0) - (a.returnDaily || 0))
      .slice(0, 5);

    const losers = stockArray
      .filter((s) => (s.returnDaily || 0) < 0)
      .sort((a, b) => (a.returnDaily || 0) - (b.returnDaily || 0))
      .slice(0, 5);

    const topScored = stockArray
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);

    const avgReturn =
      stockArray.reduce((sum, s) => sum + (s.returnDaily || 0), 0) /
      stockArray.length;

    const bullishCount = stockArray.filter(
      (s) => s.maStatus === 'BULLISH'
    ).length;

    const gainCount = gainers.length;

    const marketSentiment =
      gainCount > stockArray.length / 2
        ? 'BULLISH'
        : gainCount < stockArray.length / 4
          ? 'BEARISH'
          : 'NEUTRAL';

    return {
      gainers,
      losers,
      topScored,
      avgReturn,
      bullishCount,
      gainCount,
      marketSentiment,
      totalStocks: stockArray.length,
    };
  }, [stocks]);

  if (!summary) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No market data available</p>
      </div>
    );
  }

  const sentimentColor = {
    BULLISH: 'bg-green-50 border-green-200',
    NEUTRAL: 'bg-yellow-50 border-yellow-200',
    BEARISH: 'bg-red-50 border-red-200',
  };

  const sentimentText = {
    BULLISH: 'text-green-900',
    NEUTRAL: 'text-yellow-900',
    BEARISH: 'text-red-900',
  };

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className={`border rounded-lg p-6 ${sentimentColor[summary.marketSentiment]}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${sentimentText[summary.marketSentiment]}`}>
            Market Sentiment: {summary.marketSentiment}
          </h2>
          <span className="text-sm font-semibold text-gray-600">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm opacity-75 mb-1">Total Stocks</p>
            <p className="text-2xl font-bold">{summary.totalStocks}</p>
          </div>
          <div>
            <p className="text-sm opacity-75 mb-1">Gainers</p>
            <p className="text-2xl font-bold text-green-600">
              {summary.gainCount}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-75 mb-1">Avg Return</p>
            <p className={`text-2xl font-bold ${summary.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.avgReturn.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-sm opacity-75 mb-1">Bullish MACD</p>
            <p className="text-2xl font-bold">
              {summary.bullishCount}
            </p>
          </div>
        </div>
      </div>

      {/* Gainers & Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🚀 Top Gainers
          </h3>
          <div className="space-y-3">
            {summary.gainers.map((stock) => (
              <div
                key={stock.ticker}
                className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {stock.ticker.replace('.NS', '')}
                  </p>
                  <p className="text-xs text-gray-600">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    +{stock.returnDaily?.toFixed(2) || '0.00'}%
                  </p>
                  <p className="text-xs text-gray-600">
                    ₹{stock.cmp?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📉 Top Losers
          </h3>
          <div className="space-y-3">
            {summary.losers.map((stock) => (
              <div
                key={stock.ticker}
                className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {stock.ticker.replace('.NS', '')}
                  </p>
                  <p className="text-xs text-gray-600">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">
                    {stock.returnDaily?.toFixed(2) || '0.00'}%
                  </p>
                  <p className="text-xs text-gray-600">
                    ₹{stock.cmp?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Scored Stocks */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⭐ Top Scored Today
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {summary.topScored.map((stock, i) => (
            <div
              key={stock.ticker}
              className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 text-center"
            >
              <p className="text-xs text-gray-600 mb-1">#{i + 1}</p>
              <p className="font-bold text-gray-900 text-sm mb-2">
                {stock.ticker.replace('.NS', '')}
              </p>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-blue-900">
                  {stock.score || 0}
                </p>
                <p className="text-xs text-gray-600">
                  ₹{stock.cmp?.toFixed(0) || 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">
          📊 Key Insights
        </h3>
        <ul className="space-y-2 text-sm text-purple-800">
          <li>
            • <strong>{(summary.gainCount / summary.totalStocks * 100).toFixed(0)}% of stocks</strong> are in positive territory
          </li>
          <li>
            • Market average return is <strong>{summary.avgReturn.toFixed(2)}%</strong>
          </li>
          <li>
            • <strong>{summary.bullishCount} stocks</strong> show bullish MACD signals
          </li>
          <li>
            • Current market trend appears <strong>{summary.marketSentiment.toLowerCase()}</strong>
          </li>
        </ul>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Summary'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Last updated: {new Date().toLocaleTimeString('en-IN')}
        </p>
      </div>
    </div>
  );
}

export default PostMarketSummary;

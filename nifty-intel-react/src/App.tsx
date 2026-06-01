import { useState } from 'react';
import { useStocksData, useStockList, useScreenerFilters } from '@/hooks';
import { ScreenerTable, ScreenerFilters } from '@/components/Screener';
import { LoadingSpinner, ErrorBoundary } from '@/components/Common';
import { useStockStore } from '@/store/stockStore';

function App() {
  const { isLoading, refetch } = useStocksData();
  const stocks = useStockList();
  const fetchStatus = useStockStore((state) => state.fetchStatus);
  const error = useStockStore((state) => state.error);

  const {
    filters,
    applyFilters,
    updateFilter,
    updateSort,
    sectors,
  } = useScreenerFilters();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">NIFTY-INTEL</h1>
            <p className="text-sm text-gray-600 mt-1">
              Stock Screener & Analysis Platform
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Loading State */}
          {isLoading && stocks.length === 0 && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <LoadingSpinner
                  message={`Loading stocks... ${fetchStatus}`}
                  size="lg"
                />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">
                Error loading data
              </h3>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-semibold"
              >
                {refreshing ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          )}

          {/* Content */}
          {!isLoading && stocks.length > 0 && (
            <div className="space-y-6">
              {/* Filters */}
              <ScreenerFilters
                filters={filters}
                sectors={sectors}
                onFilterChange={updateFilter}
                onRefresh={handleRefresh}
                loading={refreshing || isLoading}
              />

              {/* Summary */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Stock Screener
                  </h2>
                  <p className="text-sm text-gray-600">
                    {stocks.length} stocks match your filters
                  </p>
                </div>
              </div>

              {/* Table */}
              <ScreenerTable
                stocks={stocks}
                onSort={updateSort}
                sortKey={filters.sortKey}
                sortDir={filters.sortDir}
              />

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 py-4">
                Data updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && stocks.length === 0 && !error && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-gray-600 text-lg mb-4">No stocks loaded</p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                >
                  Load Data
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;

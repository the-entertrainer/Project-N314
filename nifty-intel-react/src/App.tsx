import { useStocksData, useStockList } from '@/hooks';
import { useStockStore } from '@/store/stockStore';

function App() {
  const { isLoading, error } = useStocksData();
  const stocks = useStockList();
  const fetchStatus = useStockStore((state) => state.fetchStatus);

  return (
    <div className="w-screen h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">NIFTY-INTEL</h1>
          <p className="text-sm text-gray-600">Stock Screener & Analysis</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
              <p className="mt-4 text-gray-600">
                Loading {stocks.length} stocks...
              </p>
              <p className="text-sm text-gray-500">
                Status: {fetchStatus}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800">Error loading data</h3>
            <p className="text-red-700">{String(error)}</p>
          </div>
        )}

        {!isLoading && stocks.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Stock Screener
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Showing {stocks.length} stocks
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">
                        Ticker
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">
                        Price
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">
                        Score
                      </th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-700">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.slice(0, 20).map((stock) => (
                      <tr key={stock.ticker} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium text-gray-900">
                          {stock.ticker}
                        </td>
                        <td className="py-2 px-3 text-gray-700">
                          {stock.name}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-900">
                          ₹{stock.cmp?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-gray-900">
                          {stock.score || 0}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-white">
                          <span className="bg-blue-500 rounded px-2 py-1 inline-block">
                            {stock.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Showing first 20 of {stocks.length} stocks
              </p>
            </div>
          </div>
        )}

        {!isLoading && stocks.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-600">No stocks loaded</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

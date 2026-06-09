'use client';

export default function StockScreener() {
  return (
    <div>
      <h2 className="text-4xl font-bold tracking-tighter mb-8">Stock Screener</h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
        <p className="text-xl text-zinc-400 mb-4">Advanced Filtering Engine</p>
        <p className="text-zinc-500 max-w-md mx-auto">Filter by PE, Volume, Market Cap, Sector, Technical Indicators. TanStack Table + real data integration in progress.</p>
      </div>
    </div>
  );
}

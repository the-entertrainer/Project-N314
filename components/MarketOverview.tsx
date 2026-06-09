'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function MarketOverview() {
  const [indices, setIndices] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockData: MarketData[] = [
      { symbol: 'NIFTY 50', price: 24850.45, change: 124.65, changePercent: 0.50 },
      { symbol: 'BANK NIFTY', price: 51234.80, change: -245.30, changePercent: -0.48 },
      { symbol: 'SENSEX', price: 81234.50, change: 89.75, changePercent: 0.11 },
      { symbol: 'NIFTY IT', price: 34567.90, change: 456.20, changePercent: 1.34 },
    ];
    setIndices(mockData);
    setLoading(false);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-bold tracking-tighter">Market Snapshot</h2>
          <p className="text-zinc-500">Real-time Indian Indices • Updated moments ago</p>
        </div>
        <div className="text-sm text-zinc-500">June 10, 2026</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {indices.map((index, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 hover:border-emerald-500/50 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-zinc-500">{index.symbol}</div>
                <div className="text-4xl font-mono font-semibold mt-3 tracking-tighter">{index.price.toLocaleString('en-IN')}</div>
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${index.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {index.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {index.changePercent.toFixed(2)}%
              </div>
            </div>
            <div className="mt-2 text-sm text-zinc-500">₹{index.change.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-6">Top Gainers & Losers</h3>
        <div className="bg-zinc-900 rounded-3xl p-8 text-center text-zinc-500 border border-zinc-800">
          Advanced movers table & Recharts coming soon...
        </div>
      </div>
    </div>
  );
}

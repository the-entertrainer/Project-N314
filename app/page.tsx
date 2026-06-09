'use client';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Nifty Intel
        </h1>
        <p className="text-xl text-center text-zinc-400 mb-12">AI-Powered Stock Insights for Indian Markets</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4">Market Overview</h2>
            <p className="text-zinc-400">Live indices and top movers</p>
          </div>
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4">Stock Screener</h2>
            <p className="text-zinc-400">Advanced filtering & analysis</p>
          </div>
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4">AI Advisor</h2>
            <p className="text-zinc-400">Gemini-powered insights</p>
          </div>
        </div>
      </div>
    </div>
  );
}

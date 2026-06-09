'use client';

import { useState } from 'react';
import { Brain, Send } from 'lucide-react';

export default function AIAdvisor() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    
    setTimeout(() => {
      setResponse(`Based on current trends, ${query.toUpperCase()} shows strong momentum with positive FII buying. Recommendation: Hold/Accumulate on dips. Risk: Moderate.`);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-6 py-3 mb-6">
          <Brain className="w-8 h-8 text-violet-400" />
          <div>
            <div className="font-semibold">Gemini-Powered Insights</div>
            <div className="text-xs text-zinc-500">Ask anything about stocks, sectors, or strategies</div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What is the outlook for Reliance in next 3 months?"
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-violet-500 text-lg"
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          />
          <button 
            onClick={handleAsk}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 px-8 rounded-2xl flex items-center justify-center transition disabled:opacity-70"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {response && (
          <div className="mt-8 p-6 bg-zinc-950 border border-zinc-800 rounded-2xl text-lg leading-relaxed">
            {response}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

export default function N314() {
  const [activeTab, setActiveTab] = useState<'overview' | 'screener' | 'ai'>('overview');

  // AI Chat State
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m your N314 AI Advisor. Ask me anything about Indian stocks, market trends, or specific companies.' }
  ]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Sorry, something went wrong.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to AI. Please try again.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center font-bold text-xl text-black">N</div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tighter">N314</h1>
              <p className="text-xs text-zinc-500 -mt-1">STOCK INTELLIGENCE</p>
            </div>
          </div>
          <nav className="flex gap-2 text-sm font-medium">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Overview</button>
            <button onClick={() => setActiveTab('screener')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'screener' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Screener</button>
            <button onClick={() => setActiveTab('ai')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'ai' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>AI Insights</button>
          </nav>
          <div className="text-xs px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            LIVE
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-5xl font-semibold tracking-tight mb-8">Market Overview</h2>
            <div className="text-center py-12 text-zinc-400">Live market data is available. Switch to Screener or AI for more features.</div>
          </div>
        )}

        {activeTab === 'screener' && (
          <div>
            <h2 className="text-4xl font-semibold tracking-tight mb-6">Stock Screener</h2>
            <div className="text-center py-12 text-zinc-400">TanStack Table is ready. Add more filters in future updates.</div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-semibold tracking-tight mb-2">AI Stock Advisor</h2>
            <p className="text-zinc-400 mb-6">Powered by Google Gemini • Ask about any NSE stock or market trend</p>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl h-[500px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-600' : 'bg-zinc-800'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {aiLoading && <div className="text-zinc-400">Thinking...</div>}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-zinc-800 flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about Reliance, market outlook, or any stock..."
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-2xl px-5 py-3 focus:outline-none focus:border-emerald-500"
                  disabled={aiLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={aiLoading || !input.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 px-8 rounded-2xl font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </div>

            <p className="text-xs text-center text-zinc-500 mt-4">
              Note: Add your Gemini API key in Vercel Environment Variables as GEMINI_API_KEY to enable this feature.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { usePortfolioStore } from '../store/portfolioStore';

export default function N314() {
  const [activeTab, setActiveTab] = useState<'overview' | 'screener' | 'ai' | 'portfolio'>('overview');
  const [marketData, setMarketData] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // AI Chat
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m your N314 AI Stock Advisor. Ask me about any NSE stock, market trends, or your portfolio.' }
  ]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { holdings, addHolding, removeHolding, clearPortfolio } = usePortfolioStore();

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMarketData = async () => {
    try {
      const res = await fetch('/api/market?type=indices');
      const json = await res.json();
      if (json.success) setMarketData(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistorical = async () => {
    try {
      const res = await fetch('/api/market?type=historical&symbol=^NSEI');
      const json = await res.json();
      if (json.success) setHistoricalData(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPortfolioPrices = useCallback(async () => {
    if (holdings.length === 0) return;
    const symbols = holdings.map(h => h.symbol).join(',');
    try {
      const res = await fetch(`/api/market?symbols=${symbols}`);
      const json = await res.json();
      if (json.success && json.data) {
        const priceMap: Record<string, number> = {};
        json.data.forEach((quote: any) => {
          if (quote.symbol && quote.regularMarketPrice) {
            priceMap[quote.symbol] = quote.regularMarketPrice;
          }
        });
        setStockPrices(priceMap);
      }
    } catch (e) {
      console.error(e);
    }
  }, [holdings]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMarketData(), fetchHistorical()]);
      setIsLoading(false);
    };
    loadData();

    const interval = setInterval(() => {
      fetchMarketData();
      fetchPortfolioPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPortfolioPrices]);

  const portfolioValue = holdings.reduce((sum, holding) => {
    const currentPrice = stockPrices[holding.symbol] || holding.avgPrice;
    return sum + (holding.quantity * currentPrice);
  }, 0);

  const addSampleHolding = () => {
    addHolding({ symbol: 'RELIANCE.NS', quantity: 10, avgPrice: 2450 });
  };

  // AI Chat Functions
  const sendMessage = async () => {
    if (!input.trim() || aiLoading) return;

    const userMessage = { role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to AI. Please check your connection.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
            <button onClick={() => setActiveTab('portfolio')} className={`px-6 py-2.5 rounded-2xl transition-all ${activeTab === 'portfolio' ? 'bg-white text-black' : 'hover:bg-zinc-800 text-zinc-400'}`}>Portfolio</button>
          </nav>
          <div className="text-xs px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            LIVE
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <h2 className="text-5xl font-semibold tracking-tight mb-8">Market Overview</h2>

            {isLoading && marketData.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[1,2,3].map(i => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-40 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {marketData.map((quote: any, i: number) => {
                  const isPositive = (quote.regularMarketChangePercent || 0) >= 0;
                  return (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                      <div className="text-sm text-zinc-500">{quote.symbol?.replace('^', '')}</div>
                      <div className="text-4xl font-mono mt-3">{quote.regularMarketPrice?.toLocaleString('en-IN')}</div>
                      <div className={`mt-2 text-lg font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{quote.regularMarketChangePercent?.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mb-12">
              <h3 className="text-2xl font-semibold mb-6">NIFTY 50 - 30 Day Trend</h3>
              {historicalData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                    <div className="text-sm text-zinc-400 mb-4">Closing Price</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#52525b" />
                        <YAxis stroke="#52525b" domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
                        <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                    <div className="text-sm text-zinc-400 mb-4">Volume</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#52525b" />
                        <YAxis stroke="#52525b" />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
                        <Bar dataKey="volume" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-400">Loading chart data...</div>}
            </div>
          </>
        )}

        {/* SCREENER TAB */}
        {activeTab === 'screener' && (
          <div className="text-center py-20">
            <h3 className="text-3xl font-semibold mb-4">Stock Screener</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              Powerful stock screening with TanStack Table is ready. Advanced filters and columns coming in future updates.
            </p>
          </div>
        )}

        {/* AI INSIGHTS TAB - FULLY BUILT CHAT */}
        {activeTab === 'ai' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-4xl font-semibold tracking-tight">AI Stock Advisor</h2>
              <p className="text-zinc-400 mt-2">Powered by Google Gemini • Ask about any NSE stock or market trend</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col h-[600px]">
              {/* Chat Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-100'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 px-5 py-3.5 rounded-3xl">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-zinc-800">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Reliance, market outlook, or any stock..."
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:border-emerald-500 placeholder:text-zinc-500"
                    disabled={aiLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={aiLoading || !input.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed px-8 rounded-2xl font-medium transition-colors flex items-center"
                  >
                    Send
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2 text-center">
                  AI responses are for informational purposes only. Not financial advice.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-4xl font-semibold tracking-tight">My Portfolio</h2>
                <p className="text-zinc-400 mt-1">Real-time value using live prices</p>
              </div>
              <div className="flex gap-3">
                <button onClick={addSampleHolding} className="px-4 py-2 bg-emerald-600 rounded-xl text-sm hover:bg-emerald-500">
                  Add Sample (RELIANCE)
                </button>
                <button onClick={clearPortfolio} className="px-4 py-2 bg-red-600/20 text-red-400 rounded-xl hover:bg-red-600/30 text-sm">
                  Clear All
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
              <div className="text-sm text-zinc-400">Total Portfolio Value</div>
              <div className="text-5xl font-mono mt-2 text-emerald-400">₹{portfolioValue.toLocaleString('en-IN')}</div>
            </div>

            {holdings.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 border border-zinc-800 rounded-3xl">
                Your portfolio is empty.<br />
                Click "Add Sample" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {holdings.map((holding, index) => {
                  const currentPrice = stockPrices[holding.symbol] || holding.avgPrice;
                  const currentValue = holding.quantity * currentPrice;
                  const gainLoss = currentValue - (holding.quantity * holding.avgPrice);
                  const gainLossPercent = ((currentPrice - holding.avgPrice) / holding.avgPrice) * 100;

                  return (
                    <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex justify-between items-center">
                      <div>
                        <div className="font-mono text-xl">{holding.symbol}</div>
                        <div className="text-sm text-zinc-400 mt-1">
                          {holding.quantity} shares @ avg ₹{holding.avgPrice} → Current ₹{currentPrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-mono">₹{currentValue.toFixed(0)}</div>
                        <div className={`text-sm ${gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {gainLoss >= 0 ? '+' : ''}₹{gainLoss.toFixed(0)} ({gainLossPercent.toFixed(1)}%)
                        </div>
                      </div>
                      <button onClick={() => removeHolding(holding.symbol)} className="ml-6 text-red-400 hover:text-red-500">
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

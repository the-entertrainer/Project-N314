'use client';

import { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp } from 'lucide-react';
import ThreeDOrb from '../components/ThreeDOrb';
import ShellWrapper from '../components/ShellWrapper';
import IntelligenceReport from '../components/IntelligenceReport';
import LiveMarketPanel from '../components/charts/LiveMarketPanel';
import LivePriceTicker from '../components/LivePriceTicker';
import Screener from '../components/Screener';
import Portfolio from '../components/Portfolio';
import { usePortfolioBootstrap } from '../hooks/usePortfolioBootstrap';
import { useNavigationStore } from '../store/navigationStore';

interface MarketQuote {
  symbol: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
}

interface HistoricalDataPoint {
  date: string;
  close?: number;
  volume?: number;
}

function formatIndexLabel(symbol?: string) {
  const labels: Record<string, string> = {
    '^NSEI': 'NIFTY 50',
    '^NSEBANK': 'BANK NIFTY',
    '^BSESN': 'SENSEX',
  };
  return labels[symbol || ''] || symbol?.replace('^', '') || '—';
}

function N314App() {
  const activeTab = useNavigationStore((s) => s.activeTab);
  const [marketData, setMarketData] = useState<MarketQuote[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreloader, setShowPreloader] = useState(true);

  usePortfolioBootstrap();

  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 1200);
    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMarketData(), fetchHistorical()]);
      setIsLoading(false);
    };
    loadData();

    const pollMs = activeTab === 'overview' ? 3000 : 30000;
    const interval = setInterval(() => {
      fetchMarketData();
      if (activeTab === 'overview') fetchHistorical();
    }, pollMs);
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <>
      <AnimatePresence>
        {showPreloader && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950"
          >
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <ThreeDOrb size="lg" />
              </div>
              <div className="text-4xl sm:text-5xl font-semibold tracking-tight">N314</div>
              <div className="text-emerald-400 text-[10px] tracking-[0.25em] mt-2 uppercase">
                Stock Intelligence
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShellWrapper>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Market Overview</h2>
              <p className="text-zinc-400 mt-1 text-sm sm:text-base">
                Real-time insights across major Indian indices
              </p>
            </div>

            {isLoading && marketData.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card p-6 h-36 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {marketData.map((quote, i) => {
                  const isPositive = (quote.regularMarketChangePercent || 0) >= 0;
                  return (
                    <div
                      key={i}
                      className="glass-card p-5 sm:p-6 hover:border-emerald-500/20 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-zinc-500 tracking-wider uppercase truncate">
                            {formatIndexLabel(quote.symbol)}
                          </div>
                          <LivePriceTicker
                            price={quote.regularMarketPrice}
                            className="text-3xl sm:text-4xl font-mono tracking-tight mt-1 tabular-nums block"
                          />
                        </div>
                        <div
                          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {isPositive ? '+' : ''}
                          {quote.regularMarketChangePercent?.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <LiveMarketPanel historicalData={historicalData} />
          </div>
        )}

        {activeTab === 'screener' && <Screener />}
        {activeTab === 'ai' && <IntelligenceReport />}
        {activeTab === 'portfolio' && <Portfolio />}
      </ShellWrapper>
    </>
  );
}

export default function N314() {
  return (
    <Suspense fallback={null}>
      <N314App />
    </Suspense>
  );
}
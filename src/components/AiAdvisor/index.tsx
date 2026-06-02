import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { fmtPrice, fmtPct } from '../../utils/formatters';
import type { AdvisorOutput } from '../../types';

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

const DIRECTION_STYLE: Record<string, string> = {
  up:       'text-teal-300 bg-teal-500/15 border-teal-500/30',
  down:     'text-red-400 bg-red-500/15 border-red-500/30',
  sideways: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
};

const AiAdvisor: React.FC = () => {
  const [output,  setOutput]  = useState<AdvisorOutput | null>(useAppStore.getState().advisor);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const getTopScored  = useAppStore((s) => s.getTopScored);
  const getTopMovers  = useAppStore((s) => s.getTopMovers);
  const fiiDii        = useAppStore((s) => s.fiiDii);
  const indices       = useAppStore((s) => s.indices);
  const setAdvisor    = useAppStore((s) => s.setAdvisor);
  const setSelectedTicker = useAppStore((s) => s.setSelectedTicker);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { getAdvisorOutput } = await import('../../services/geminiService');
      const { gainers, losers }  = getTopMovers(5);
      const topScored            = getTopScored(10);
      const nifty                = indices.find((i) => i.symbol === '^NSEI') ?? null;
      const result               = await getAdvisorOutput(gainers, losers, topScored, fiiDii, nifty);
      setOutput(result);
      setAdvisor(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <SparklesIcon />
          <h1 className="text-lg font-bold gradient-text">AI Market Advisor</h1>
        </div>
        <p className="text-white/40 text-sm mb-4">
          Gemini analyzes today's live market data — top movers, FII/DII flow, scores — and returns actionable picks.
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/30 to-violet-500/30 text-white font-semibold border border-white/15 hover:border-teal-500/40 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          <SparklesIcon />
          {loading ? 'Generating...' : output ? "Regenerate Today's Picks" : "Generate Today's Picks"}
        </button>
        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
      )}

      {output && !loading && (
        <>
          {/* Nifty Outlook */}
          <section>
            <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">Nifty Weekly Outlook</h2>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-lg border text-sm font-bold font-mono uppercase ${DIRECTION_STYLE[output.niftyOutlook.direction]}`}>
                  {output.niftyOutlook.direction}
                </span>
                <span className="text-white font-mono">Key Level: {fmtPrice(output.niftyOutlook.keyLevel)}</span>
              </div>
              <p className="text-xs text-white/60">{output.niftyOutlook.reasoning}</p>
            </div>
          </section>

          {/* Short Picks */}
          <section>
            <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">Short-Term Picks (1–5 days)</h2>
            <div className="space-y-3">
              {output.shortPicks.map((p, i) => (
                <div key={i} className="glass-card rounded-xl p-4 border border-teal-500/10 hover:border-teal-500/25 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      className="font-black text-base text-white hover:text-teal-300 transition-colors"
                      onClick={() => setSelectedTicker(p.ticker)}
                    >
                      {p.ticker}
                    </button>
                    <span className={`text-sm font-bold ${p.action === 'Buy' ? 'text-teal-300' : p.action === 'Sell' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {p.action}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono mb-3">
                    <div><span className="text-white/40">Entry</span><br /><span className="text-white">{fmtPrice(p.entry)}</span></div>
                    <div><span className="text-white/40">Target</span><br /><span className="text-teal-300">{fmtPrice(p.target)}</span></div>
                    <div><span className="text-white/40">SL</span><br /><span className="text-red-400">{fmtPrice(p.sl)}</span></div>
                  </div>
                  <p className="text-xs text-white/50">{p.reasoning}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Long Picks */}
          <section>
            <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">Long-Term Compounders (6–12 months)</h2>
            <div className="space-y-3">
              {output.longPicks.map((p, i) => (
                <div key={i} className="glass-card rounded-xl p-4 border border-violet-500/10 hover:border-violet-500/25 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      className="font-black text-base text-white hover:text-violet-300 transition-colors"
                      onClick={() => setSelectedTicker(p.ticker)}
                    >
                      {p.ticker}
                    </button>
                    <span className="text-xs text-white/40 font-mono">{p.timeframe}</span>
                  </div>
                  <p className="text-xs text-white/50">{p.thesis}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Avoid List */}
          {output.avoidList.length > 0 && (
            <section>
              <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">Avoid for Now</h2>
              <div className="space-y-2">
                {output.avoidList.map((p, i) => (
                  <div key={i} className="glass-card rounded-xl p-3 border border-red-500/10 flex items-start gap-3">
                    <span className="font-bold text-red-400 text-sm">{p.ticker}</span>
                    <p className="text-xs text-white/50 flex-1">{p.reason}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="text-xs text-white/20 text-center pb-4">
            AI-generated analysis based on live market data. Not financial advice. Always do your own research.
          </p>
        </>
      )}
    </div>
  );
};

export default AiAdvisor;

import React, { useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { fmtPrice, fmtPct, fmtNum } from '../../utils/formatters';

const FnoIntelligence: React.FC = () => {
  const quotes    = useAppStore((s) => s.quotes);
  const fnoData   = useAppStore((s) => s.fnoData);
  const setSelectedTicker = useAppStore((s) => s.setSelectedTicker);

  const flaggedStocks = useMemo(() => {
    const list = [...quotes.values()].filter((q) => q.fnoFlag);
    return list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [quotes.size]);

  const fnoStocks = useMemo(() => {
    const list = [...quotes.values()].filter((q) => q.isFno);
    return list.sort((a, b) => b.volumeRatio - a.volumeRatio).slice(0, 50);
  }, [quotes.size]);

  const niftyFno = fnoData.get('NIFTY');

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* NIFTY Option Chain Summary */}
      {niftyFno && (
        <section>
          <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">NIFTY Option Chain</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total OI',  value: (niftyFno.oi / 1e6).toFixed(2) + 'M' },
              { label: 'PCR',       value: fmtNum(niftyFno.pcr, 2) },
              { label: 'Max Pain',  value: fmtPrice(niftyFno.maxPain) },
              { label: 'Lot Size',  value: String(niftyFno.lotSize) },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card rounded-xl p-4">
                <p className="text-xs text-white/40 font-mono">{label}</p>
                <p className="text-lg font-bold text-white mt-1">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/20 mt-2 font-mono">
            PCR &gt; 1 = bullish sentiment | PCR &lt; 0.7 = bearish | Max Pain = level where most options expire worthless
          </p>
        </section>
      )}

      {/* Smart Money Flag */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest">Smart Money Accumulation Signal</h2>
          <span className="px-2 py-0.5 text-xs rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-mono">
            {flaggedStocks.length} stocks
          </span>
        </div>
        <p className="text-xs text-white/25 mb-3">
          Criteria: F&O eligible + volume surge (1.5x avg) + price near flat + reasonable valuations
        </p>
        {flaggedStocks.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center text-white/30 text-sm">
            {quotes.size === 0 ? 'Loading stock data...' : 'No smart money signals detected today'}
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Stock', 'CMP', 'Change%', 'Vol Ratio', 'P/E', 'P/B', 'Score', 'Grade'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs text-white/40 font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flaggedStocks.map((s) => (
                  <tr
                    key={s.ticker}
                    className="border-b border-white/5 hover:bg-violet-500/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicker(s.ticker)}
                  >
                    <td className="px-3 py-2">
                      <p className="font-bold text-white text-xs">{s.ticker}</p>
                      <p className="text-white/40 text-xs truncate max-w-[120px]">{s.name}</p>
                    </td>
                    <td className="px-3 py-2 font-mono text-white text-xs">{fmtPrice(s.price)}</td>
                    <td className={`px-3 py-2 font-mono text-xs ${s.changePct >= 0 ? 'text-teal-400' : 'text-red-400'}`}>{fmtPct(s.changePct)}</td>
                    <td className="px-3 py-2 font-mono text-amber-300 text-xs">{fmtNum(s.volumeRatio, 2)}x</td>
                    <td className="px-3 py-2 font-mono text-white/50 text-xs">{s.pe != null ? fmtNum(s.pe, 1) : '—'}</td>
                    <td className="px-3 py-2 font-mono text-white/50 text-xs">{s.pb != null ? fmtNum(s.pb, 1) : '—'}</td>
                    <td className="px-3 py-2 font-mono text-white font-bold text-xs">{s.score ?? '—'}</td>
                    <td className="px-3 py-2 text-xs">
                      {s.grade && (
                        <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">
                          {s.grade}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* F&O stocks by volume surge */}
      <section>
        <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">F&O Stocks — Volume Surge</h2>
        {fnoStocks.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center text-white/30 text-sm">Loading F&O data...</div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8">
                  {['Stock', 'CMP', 'Change%', 'Vol/Avg', 'P/E', 'Score'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-white/40 font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fnoStocks.map((s) => (
                  <tr
                    key={s.ticker}
                    className={`border-b border-white/5 cursor-pointer transition-colors ${s.volumeRatio > 2 ? 'hover:bg-amber-500/5' : 'hover:bg-white/3'}`}
                    onClick={() => setSelectedTicker(s.ticker)}
                  >
                    <td className="px-3 py-2">
                      <span className="font-bold text-white">{s.ticker}</span>
                      {s.volumeRatio > 2 && (
                        <span className="ml-1 text-amber-400 text-xs">surge</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-white">{fmtPrice(s.price)}</td>
                    <td className={`px-3 py-2 font-mono ${s.changePct >= 0 ? 'text-teal-400' : 'text-red-400'}`}>{fmtPct(s.changePct)}</td>
                    <td className={`px-3 py-2 font-mono ${s.volumeRatio > 2 ? 'text-amber-300' : 'text-white/50'}`}>{fmtNum(s.volumeRatio, 2)}x</td>
                    <td className="px-3 py-2 font-mono text-white/50">{s.pe != null ? fmtNum(s.pe, 1) : '—'}</td>
                    <td className="px-3 py-2 font-mono text-white font-bold">{s.score ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default FnoIntelligence;

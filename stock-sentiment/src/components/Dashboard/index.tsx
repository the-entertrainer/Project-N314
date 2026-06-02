import React from 'react';
import { useAppStore } from '../../store/appStore';
import { fmtPrice, fmtPct, fmtCr } from '../../utils/formatters';

const ArrowUp = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);
const ArrowDown = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
  </svg>
);

const IndexCard: React.FC<{
  name: string; price: number; change: number; changePct: number; high: number; low: number;
}> = ({ name, price, change, changePct, high, low }) => {
  const pos = changePct >= 0;
  return (
    <div className={`glass-card p-4 rounded-xl border ${pos ? 'border-teal-500/20' : 'border-red-500/20'}`}>
      <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-1">{name}</p>
      <p className="text-2xl font-bold text-white">{price > 0 ? price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}</p>
      <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${pos ? 'text-teal-400' : 'text-red-400'}`}>
        {pos ? <ArrowUp /> : <ArrowDown />}
        <span>{fmtPct(changePct)}</span>
        <span className="text-white/30 text-xs">({change >= 0 ? '+' : ''}{change.toFixed(2)})</span>
      </div>
      {(high > 0 || low > 0) && (
        <p className="text-xs text-white/30 mt-2">
          H: {high.toLocaleString('en-IN', { maximumFractionDigits: 0 })} &nbsp;|&nbsp; L: {low.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
      )}
    </div>
  );
};

const FiiDiiRow: React.FC<{ label: string; buy: number; sell: number; net: number }> = ({ label, buy, sell, net }) => {
  const pos = net >= 0;
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs font-mono text-white/50 w-10">{label}</span>
      <span className="text-xs text-teal-300 w-24 text-right">{fmtCr(buy * 1e7)}</span>
      <span className="text-xs text-red-400 w-24 text-right">{fmtCr(sell * 1e7)}</span>
      <span className={`text-xs font-bold w-24 text-right ${pos ? 'text-teal-300' : 'text-red-400'}`}>{fmtCr(net * 1e7)}</span>
    </div>
  );
};

const MoverCard: React.FC<{ ticker: string; name: string; changePct: number; price: number }> = ({ ticker, name, changePct, price }) => {
  const pos = changePct >= 0;
  const setTicker = useAppStore((s) => s.setSelectedTicker);
  return (
    <button
      className="flex items-center justify-between w-full py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors text-left"
      onClick={() => setTicker(ticker)}
    >
      <div>
        <p className="text-xs font-bold text-white">{ticker}</p>
        <p className="text-xs text-white/40 truncate max-w-[100px]">{name}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-white/60">{fmtPrice(price)}</p>
        <p className={`text-xs font-bold ${pos ? 'text-teal-400' : 'text-red-400'}`}>{fmtPct(changePct)}</p>
      </div>
    </button>
  );
};

const Dashboard: React.FC = () => {
  const indices = useAppStore((s) => s.indices);
  const fiiDii  = useAppStore((s) => s.fiiDii);
  const getTopMovers = useAppStore((s) => s.getTopMovers);
  const quoteCount = useAppStore((s) => s.quotes.size);

  const { gainers, losers } = React.useMemo(() => getTopMovers(5), [quoteCount]);

  const domestic = indices.filter((i) => ['^NSEI', '^NSEBANK', '^BSESN'].includes(i.symbol));
  const global   = indices.filter((i) => ['^GSPC', '^DJI', '^IXIC', '^HSI'].includes(i.symbol));

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Domestic Indices */}
      <section>
        <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">Indian Markets</h2>
        {domestic.length === 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => <div key={i} className="glass-card rounded-xl h-24 skeleton" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {domestic.map((idx) => (
              <IndexCard key={idx.symbol} name={idx.name} price={idx.price} change={idx.change} changePct={idx.changePct} high={idx.high} low={idx.low} />
            ))}
          </div>
        )}
      </section>

      {/* Global + FII/DII */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global markets */}
        <section>
          <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">Global Markets</h2>
          <div className="glass-card rounded-xl p-4 grid grid-cols-2 gap-3">
            {global.length === 0
              ? [0, 1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-lg" />)
              : global.map((idx) => (
                  <div key={idx.symbol} className="p-2">
                    <p className="text-xs text-white/40 font-mono">{idx.name}</p>
                    <p className="text-sm font-bold text-white">{idx.price > 0 ? idx.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</p>
                    <p className={`text-xs font-medium ${idx.changePct >= 0 ? 'text-teal-400' : 'text-red-400'}`}>{fmtPct(idx.changePct)}</p>
                  </div>
                ))
            }
          </div>
        </section>

        {/* FII/DII */}
        <section>
          <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">FII / DII Flow</h2>
          <div className="glass-card rounded-xl p-4">
            {fiiDii ? (
              <>
                <div className="flex justify-between text-xs text-white/30 mb-2 px-2">
                  <span className="w-10">Source</span>
                  <span className="w-24 text-right">Buy</span>
                  <span className="w-24 text-right">Sell</span>
                  <span className="w-24 text-right">Net</span>
                </div>
                <FiiDiiRow label="FII" buy={fiiDii.fiiBuy} sell={fiiDii.fiiSell} net={fiiDii.fiiNet} />
                <FiiDiiRow label="DII" buy={fiiDii.diiBuy} sell={fiiDii.diiSell} net={fiiDii.diiNet} />
                <p className="text-xs text-white/25 mt-3">Date: {fiiDii.date}</p>
              </>
            ) : (
              <div className="h-24 skeleton rounded-lg" />
            )}
          </div>
        </section>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">
            Top Gainers <span className="text-white/20">({quoteCount} stocks loaded)</span>
          </h2>
          <div className="glass-card rounded-xl p-3">
            {gainers.length === 0
              ? <div className="h-32 skeleton rounded-lg" />
              : gainers.map((s) => <MoverCard key={s.ticker} ticker={s.ticker} name={s.name} changePct={s.changePct} price={s.price} />)
            }
          </div>
        </section>
        <section>
          <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest mb-3">Top Losers</h2>
          <div className="glass-card rounded-xl p-3">
            {losers.length === 0
              ? <div className="h-32 skeleton rounded-lg" />
              : losers.map((s) => <MoverCard key={s.ticker} ticker={s.ticker} name={s.name} changePct={s.changePct} price={s.price} />)
            }
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

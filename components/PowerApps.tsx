'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  Loader2,
  Rocket,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type { PowerPanelId } from '../types/powerApps';
import type {
  NiftyStrategyResult,
  FiiDiiResult,
  FnoResult,
  EquityDeepResult,
  IpoResult,
} from '../types/powerApps';
import SymbolAutocomplete from './SymbolAutocomplete';

const PANELS: {
  id: PowerPanelId;
  title: string;
  subtitle: string;
  icon: typeof Zap;
  endpoint: string;
  method?: 'GET' | 'POST';
}[] = [
  {
    id: 'nifty',
    title: 'Nifty Prediction',
    subtitle: 'Strategy Engine',
    icon: TrendingUp,
    endpoint: '/api/power/nifty',
  },
  {
    id: 'fiidii',
    title: 'FII / DII Tracker',
    subtitle: 'Institutional Flows',
    icon: Users,
    endpoint: '/api/power/fii-dii',
  },
  {
    id: 'fno',
    title: 'F&O Analyzer',
    subtitle: 'Volume & Trends',
    icon: BarChart3,
    endpoint: '/api/power/fno',
  },
  {
    id: 'equity',
    title: 'Equity Deep-Dive',
    subtitle: 'Long-Term Analysis',
    icon: Building2,
    endpoint: '/api/power/equity',
    method: 'POST',
  },
  {
    id: 'ipo',
    title: 'IPO Hub',
    subtitle: 'Listing Plays',
    icon: Rocket,
    endpoint: '/api/power/ipo',
  },
];

interface PowerAppsProps {
  activePanel: PowerPanelId;
  onPanelChange: (id: PowerPanelId) => void;
}

function PanelShell({
  title,
  subtitle,
  icon: Icon,
  active,
  onClick,
  children,
}: {
  title: string;
  subtitle: string;
  icon: typeof Zap;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`glass-card flex flex-col min-h-0 overflow-hidden transition-all ${
        active ? 'ring-2 ring-emerald-500/40 border-emerald-500/30' : ''
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 px-4 py-3 flex items-center gap-3 text-left border-b border-white/5 hover:bg-white/[0.02]"
      >
        <div className={`p-2 rounded-xl ${active ? 'bg-emerald-500/15' : 'bg-zinc-800/80'}`}>
          <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-zinc-400'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{title}</div>
          <div className="text-[10px] text-zinc-500 truncate">{subtitle}</div>
        </div>
        {active && <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
      </button>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 text-sm">{children}</div>
    </div>
  );
}

export default function PowerApps({ activePanel, onPanelChange }: PowerAppsProps) {
  const [loading, setLoading] = useState<Record<PowerPanelId, boolean>>({
    nifty: false,
    fiidii: false,
    fno: false,
    equity: false,
    ipo: false,
  });
  const [errors, setErrors] = useState<Partial<Record<PowerPanelId, string>>>({});
  const [nifty, setNifty] = useState<NiftyStrategyResult | null>(null);
  const [fiidii, setFiidii] = useState<FiiDiiResult | null>(null);
  const [fno, setFno] = useState<FnoResult | null>(null);
  const [equity, setEquity] = useState<EquityDeepResult | null>(null);
  const [ipo, setIpo] = useState<IpoResult | null>(null);
  const [equitySymbol, setEquitySymbol] = useState('RELIANCE.NS');

  const fetchPanel = useCallback(async (id: PowerPanelId) => {
    const panel = PANELS.find((p) => p.id === id);
    if (!panel) return;

    setLoading((l) => ({ ...l, [id]: true }));
    setErrors((e) => ({ ...e, [id]: undefined }));

    try {
      const opts: RequestInit =
        panel.method === 'POST'
          ? {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symbol: equitySymbol }),
            }
          : { cache: 'no-store' };

      const res = await fetch(panel.endpoint, opts);
      const json = await res.json();
      if (!json.success) {
        setErrors((e) => ({ ...e, [id]: json.error || 'Analysis failed' }));
        return;
      }

      switch (id) {
        case 'nifty':
          setNifty(json.data);
          break;
        case 'fiidii':
          setFiidii(json.data);
          break;
        case 'fno':
          setFno(json.data);
          break;
        case 'equity':
          setEquity(json.data);
          break;
        case 'ipo':
          setIpo(json.data);
          break;
      }
    } catch {
      setErrors((e) => ({ ...e, [id]: 'Network error' }));
    } finally {
      setLoading((l) => ({ ...l, [id]: false }));
    }
  }, [equitySymbol]);

  useEffect(() => {
    fetchPanel(activePanel === 'equity' ? 'nifty' : activePanel);

    const queue = PANELS.filter((p) => p.id !== 'equity' && p.id !== activePanel).map((p) => p.id);
    let idx = 0;
    const timer = setInterval(() => {
      if (idx >= queue.length) {
        clearInterval(timer);
        return;
      }
      fetchPanel(queue[idx]);
      idx += 1;
    }, 2500);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activePanel !== 'equity') fetchPanel(activePanel);
  }, [activePanel, fetchPanel]);

  useEffect(() => {
    if (activePanel === 'equity') fetchPanel('equity');
  }, [equitySymbol, activePanel, fetchPanel]);

  const renderContent = (id: PowerPanelId) => {
    if (loading[id]) {
      return (
        <div className="flex items-center gap-2 text-zinc-500 py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Running Groq analysis…
        </div>
      );
    }
    if (errors[id]) {
      return (
        <div className="text-red-400 text-xs py-4">
          {errors[id]}
          <button
            onClick={() => fetchPanel(id)}
            className="block mt-2 text-emerald-400 underline"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (id) {
      case 'nifty':
        return nifty ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900/50 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500">Current</div>
                <div className="font-mono font-semibold">{nifty.current_price.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500">Risk</div>
                <div className="capitalize">{nifty.risk_level}</div>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500">Pred. Tomorrow</div>
                <div className="font-mono text-emerald-400">{nifty.predicted_next_day.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500">Pred. Week</div>
                <div className="font-mono text-emerald-400">{nifty.predicted_week.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <p className="text-zinc-400 text-xs">{nifty.baseline_trend}</p>
            <p className="text-zinc-300">{nifty.outlook}</p>
            <ul className="space-y-1.5">
              {nifty.strategies.map((s, i) => (
                <li key={i} className="text-xs text-zinc-400 flex gap-2">
                  <span className="text-emerald-500">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ) : null;

      case 'fiidii':
        return fiidii ? (
          <div className="space-y-3">
            <div className="text-[10px] text-zinc-500">EOD · {fiidii.date}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900/50 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500">FII Net (₹ Cr)</div>
                <div className={`font-mono font-semibold ${fiidii.fii_net_cr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fiidii.fii_net_cr >= 0 ? '+' : ''}
                  {fiidii.fii_net_cr.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500">DII Net (₹ Cr)</div>
                <div className={`font-mono font-semibold ${fiidii.dii_net_cr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fiidii.dii_net_cr >= 0 ? '+' : ''}
                  {fiidii.dii_net_cr.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div className="text-xs">
              <span className="text-zinc-500">Sentiment: </span>
              <span className="text-emerald-400">{fiidii.institutional_sentiment}</span>
            </div>
            <p className="text-zinc-400 text-xs">{fiidii.market_impact}</p>
            <p className="text-zinc-300 text-xs">{fiidii.analysis}</p>
          </div>
        ) : null;

      case 'fno':
        return fno ? (
          <div className="space-y-3">
            <div className="font-mono font-semibold text-emerald-400">{fno.top_symbol}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-900/50 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500">Vol. Share</div>
                <div>{fno.volume_share_pct}%</div>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500">Trend</div>
                <div className="capitalize">{fno.trend}</div>
              </div>
              <div className="bg-zinc-900/50 rounded-xl p-3 col-span-2">
                <div className="text-[10px] text-zinc-500">Risk : Reward</div>
                <div className="font-semibold text-amber-400">{fno.risk_reward_ratio}</div>
              </div>
            </div>
            <p className="text-zinc-300">{fno.strategy}</p>
            <div className="text-xs space-y-1 text-zinc-500">
              <div>Instrument: <span className="text-zinc-300 capitalize">{fno.instrument}</span></div>
              <div>Entry: <span className="text-zinc-300">{fno.entry_zone}</span></div>
              <div>SL: <span className="text-red-400">{fno.stop_loss}</span> · Target: <span className="text-emerald-400">{fno.target}</span></div>
            </div>
          </div>
        ) : null;

      case 'equity':
        return (
          <div className="space-y-3">
            <SymbolAutocomplete
              value={equitySymbol}
              onChange={setEquitySymbol}
              onSubmit={() => fetchPanel('equity')}
              placeholder="Nifty 500 symbol…"
            />
            <button onClick={() => fetchPanel('equity')} className="btn-primary w-full py-2 text-xs">
              Run Deep-Dive
            </button>
            {equity && (
              <div className="space-y-3 pt-2">
                <div>
                  <div className="font-mono font-semibold">{equity.symbol}</div>
                  <div className="text-xs text-zinc-500">{equity.company_name} · {equity.sector}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-900/50 rounded-xl p-3">
                    <div className="text-[10px] text-zinc-500">Buy Zone</div>
                    <div className="text-emerald-400">{equity.buy_zone}</div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-3">
                    <div className="text-[10px] text-zinc-500">Target</div>
                    <div>{equity.target_price}</div>
                  </div>
                </div>
                <p className="text-zinc-300 text-xs">{equity.summary}</p>
                <div className="text-xs text-zinc-500">Sector: {equity.sector_health}</div>
                <div className="text-xs text-zinc-500">Growth: {equity.growth_trend}</div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Catalysts</div>
                  <ul className="space-y-1">
                    {equity.catalysts.map((c, i) => (
                      <li key={i} className="text-xs text-emerald-400/80">+ {c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase mb-1">Risks</div>
                  <ul className="space-y-1">
                    {equity.risks.map((r, i) => (
                      <li key={i} className="text-xs text-red-400/80">! {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );

      case 'ipo':
        return ipo ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">{ipo.market_context}</p>
            {ipo.ipos.map((item, i) => (
              <div key={i} className="border border-white/5 rounded-xl p-3 space-y-1.5">
                <div className="font-medium text-sm">{item.name}</div>
                <div
                  className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${
                    item.recommendation === 'Long-Term Buy'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : item.recommendation === 'Apply for Short-Term Listing Gains'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {item.recommendation}
                </div>
                <p className="text-xs text-zinc-400">{item.summary}</p>
                <ul className="space-y-0.5">
                  {item.reasons.map((r, j) => (
                    <li key={j} className="text-[10px] text-zinc-500">• {r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="shrink-0 mb-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-emerald-400" />
          Power Apps
        </h2>
        <p className="text-zinc-400 text-sm mt-1">Advanced market analysis modules</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
          {PANELS.map((p) => (
            <PanelShell
              key={p.id}
              title={p.title}
              subtitle={p.subtitle}
              icon={p.icon}
              active={activePanel === p.id}
              onClick={() => onPanelChange(p.id)}
            >
              <div
                className={
                  activePanel === p.id
                    ? 'min-h-[180px]'
                    : 'max-h-[120px] overflow-hidden opacity-75'
                }
              >
                {renderContent(p.id)}
              </div>
            </PanelShell>
          ))}
        </div>
      </div>
    </div>
  );
}
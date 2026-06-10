'use client';

import { useState, useCallback } from 'react';
import { Loader2, Play } from 'lucide-react';
import PowerAppLayout from '../PowerAppLayout';
import AiInsightPanel from '../AiInsightPanel';
import SymbolAutocomplete from '../../SymbolAutocomplete';
import { POWER_APPS } from '../../../lib/powerRoutes';
import { usePowerSettingsStore, EQUITY_SECTORS } from '../../../store/powerSettingsStore';
import type {
  NiftyStrategyResult,
  FiiDiiResult,
  FnoResult,
  EquityDeepResult,
  IpoResult,
} from '../../../types/powerApps';

function RunButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
      {loading ? 'Analyzing…' : 'Run Analysis'}
    </button>
  );
}

function ErrorBox({ error }: { error: string }) {
  return <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>;
}

const niftyMeta = POWER_APPS[0];
const fiiMeta = POWER_APPS[1];
const fnoMeta = POWER_APPS[2];
const equityMeta = POWER_APPS[3];
const ipoMeta = POWER_APPS[4];

export function NiftyPredictionApp() {
  const { niftyLookback, strategyMode, setNiftyLookback, setStrategyMode } = usePowerSettingsStore();
  const [data, setData] = useState<NiftyStrategyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/power/nifty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookback: niftyLookback, mode: strategyMode }),
      });
      const json = await res.json();
      if (!json.success) setError(json.error || 'Failed');
      else setData(json.data);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [niftyLookback, strategyMode]);

  return (
    <PowerAppLayout title={niftyMeta.title} subtitle={niftyMeta.subtitle} icon={niftyMeta.icon} path={niftyMeta.path} settings={
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Lookback Days</label>
          <select value={niftyLookback} onChange={(e) => setNiftyLookback(Number(e.target.value) as 10 | 20 | 30)} className="input-field mt-1 py-2 text-xs">
            <option value={10}>10 days</option>
            <option value={20}>20 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Strategy Style</label>
          <select value={strategyMode} onChange={(e) => setStrategyMode(e.target.value as 'conservative' | 'aggressive')} className="input-field mt-1 py-2 text-xs">
            <option value="conservative">Conservative</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
        <div className="col-span-2"><RunButton loading={loading} onClick={run} /></div>
      </div>
    }>
      {error && <ErrorBox error={error} />}
      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="glass-card p-3"><div className="text-zinc-500">Current Nifty</div><div className="font-mono text-lg">{data.current_price.toLocaleString('en-IN')}</div></div>
            <div className="glass-card p-3"><div className="text-zinc-500">Tomorrow Est.</div><div className="font-mono text-emerald-400">{data.predicted_next_day.toLocaleString('en-IN')}</div></div>
            <div className="glass-card p-3"><div className="text-zinc-500">Week Est.</div><div className="font-mono text-emerald-400">{data.predicted_week.toLocaleString('en-IN')}</div></div>
            <div className="glass-card p-3"><div className="text-zinc-500">Risk</div><div className="capitalize">{data.risk_level}</div></div>
          </div>
          <AiInsightPanel plainSummary={data.plain_summary} indicatorExplanation={data.indicator_explanation} logicSteps={data.logic_steps}>
            <p className="text-sm text-zinc-400">{data.baseline_trend}</p>
            <p className="text-sm text-zinc-300">{data.outlook}</p>
            {data.strategies.map((s, i) => (
              <div key={i} className="border border-white/5 rounded-xl p-3 mt-2">
                <div className="font-medium text-sm text-emerald-400">{s.name}</div>
                <p className="text-xs text-zinc-500 mt-1">{s.why}</p>
                <ul className="mt-2 space-y-1">{s.steps.map((st, j) => <li key={j} className="text-xs text-zinc-400">→ {st}</li>)}</ul>
              </div>
            ))}
          </AiInsightPanel>
        </div>
      )}
    </PowerAppLayout>
  );
}

export function FiiDiiTrackerApp() {
  const { fiiSessions, setFiiSessions } = usePowerSettingsStore();
  const [data, setData] = useState<FiiDiiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/power/fii-dii', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessions: fiiSessions }) });
      const json = await res.json();
      if (!json.success) setError(json.error || 'Failed');
      else setData(json.data);
    } catch { setError('Network error'); } finally { setLoading(false); }
  }, [fiiSessions]);

  return (
    <PowerAppLayout title={fiiMeta.title} subtitle={fiiMeta.subtitle} icon={fiiMeta.icon} path={fiiMeta.path} settings={
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Historical Sessions</label>
          <select value={fiiSessions} onChange={(e) => setFiiSessions(Number(e.target.value) as 1 | 5 | 10)} className="input-field mt-1 py-2 text-xs">
            <option value={1}>Last 1 session</option>
            <option value={5}>Last 5 sessions</option>
            <option value={10}>Last 10 sessions</option>
          </select>
        </div>
        <RunButton loading={loading} onClick={run} />
      </div>
    }>
      {error && <ErrorBox error={error} />}
      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="glass-card p-3"><div className="text-zinc-500">FII Net (₹ Cr)</div><div className={`font-mono font-semibold ${data.fii_net_cr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{data.fii_net_cr >= 0 ? '+' : ''}{data.fii_net_cr.toLocaleString('en-IN')}</div></div>
            <div className="glass-card p-3"><div className="text-zinc-500">DII Net (₹ Cr)</div><div className={`font-mono font-semibold ${data.dii_net_cr >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{data.dii_net_cr >= 0 ? '+' : ''}{data.dii_net_cr.toLocaleString('en-IN')}</div></div>
          </div>
          {data.sessions?.length > 1 && (
            <div className="space-y-1">{data.sessions.map((s, i) => (
              <div key={i} className="text-[10px] text-zinc-500 flex justify-between bg-zinc-900/40 rounded-lg px-3 py-1.5">
                <span>{s.date}</span><span>FII {s.fii_net_cr} · DII {s.dii_net_cr}</span>
              </div>
            ))}</div>
          )}
          <AiInsightPanel plainSummary={data.plain_summary} indicatorExplanation={data.indicator_explanation} logicSteps={data.logic_steps}>
            <div className="text-sm">Sentiment: <span className="text-emerald-400">{data.institutional_sentiment}</span></div>
            <p className="text-sm text-zinc-400">{data.accumulation_trend}</p>
            <p className="text-sm text-zinc-300">{data.analysis}</p>
          </AiInsightPanel>
        </div>
      )}
    </PowerAppLayout>
  );
}

export function FnoAnalyzerApp() {
  const { fnoSort, targetRiskReward, setFnoSort, setTargetRiskReward } = usePowerSettingsStore();
  const [data, setData] = useState<FnoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/power/fno', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort: fnoSort, targetRr: targetRiskReward }) });
      const json = await res.json();
      if (!json.success) setError(json.error || 'Failed');
      else setData(json.data);
    } catch { setError('Network error'); } finally { setLoading(false); }
  }, [fnoSort, targetRiskReward]);

  return (
    <PowerAppLayout title={fnoMeta.title} subtitle={fnoMeta.subtitle} icon={fnoMeta.icon} path={fnoMeta.path} settings={
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Sort By</label>
          <select value={fnoSort} onChange={(e) => setFnoSort(e.target.value as 'volume' | 'oi_change' | 'price_delta')} className="input-field mt-1 py-2 text-xs">
            <option value="volume">Highest Volume</option>
            <option value="oi_change">OI Change (proxy)</option>
            <option value="price_delta">Price % Change</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Target R:R — 1:{targetRiskReward}</label>
          <input type="range" min={1} max={5} step={0.5} value={targetRiskReward} onChange={(e) => setTargetRiskReward(Number(e.target.value))} className="w-full mt-2 accent-emerald-500" />
        </div>
        <RunButton loading={loading} onClick={run} />
      </div>
    }>
      {error && <ErrorBox error={error} />}
      {data && (
        <AiInsightPanel plainSummary={data.plain_summary} indicatorExplanation={data.indicator_explanation} logicSteps={data.logic_steps}>
          <div className="font-mono font-semibold text-emerald-400">{data.top_symbol}</div>
          <div className="text-xs text-zinc-500">R:R {data.risk_reward_ratio} · {data.instrument}</div>
          <p className="text-sm text-zinc-300">{data.strategy}</p>
          <div className="text-xs space-y-1 text-zinc-500">
            <div>Entry: {data.entry_zone}</div>
            <div>SL: <span className="text-red-400">{data.stop_loss}</span> · Target: <span className="text-emerald-400">{data.target}</span></div>
          </div>
          {data.trade_steps?.map((s, i) => <div key={i} className="text-xs text-zinc-400">→ {s}</div>)}
        </AiInsightPanel>
      )}
    </PowerAppLayout>
  );
}

export function EquityDeepDiveApp() {
  const { equitySector, equityTimeline, equitySymbol, setEquitySector, setEquityTimeline, setEquitySymbol } = usePowerSettingsStore();
  const [data, setData] = useState<EquityDeepResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/power/equity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: equitySymbol, sector: equitySector, timeline: equityTimeline }) });
      const json = await res.json();
      if (!json.success) setError(json.error || 'Failed');
      else setData(json.data);
    } catch { setError('Network error'); } finally { setLoading(false); }
  }, [equitySymbol, equitySector, equityTimeline]);

  return (
    <PowerAppLayout title={equityMeta.title} subtitle={equityMeta.subtitle} icon={equityMeta.icon} path={equityMeta.path} settings={
      <div className="space-y-3">
        <SymbolAutocomplete value={equitySymbol} onChange={setEquitySymbol} placeholder="Stock symbol…" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase">Sector</label>
            <select value={equitySector} onChange={(e) => setEquitySector(e.target.value)} className="input-field mt-1 py-2 text-xs">
              {EQUITY_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase">Timeline</label>
            <select value={equityTimeline} onChange={(e) => setEquityTimeline(e.target.value as '1-3' | '5+')} className="input-field mt-1 py-2 text-xs">
              <option value="1-3">1–3 years</option>
              <option value="5+">5+ years</option>
            </select>
          </div>
        </div>
        <RunButton loading={loading} onClick={run} />
      </div>
    }>
      {error && <ErrorBox error={error} />}
      {data && (
        <AiInsightPanel plainSummary={data.plain_summary} indicatorExplanation={data.indicator_explanation} logicSteps={data.logic_steps}>
          <div className="font-mono font-semibold">{data.symbol}</div>
          <div className="text-xs text-zinc-500">{data.company_name} · {data.timeline}</div>
          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
            <div className="glass-card p-3"><div className="text-zinc-500">Buy Zone</div><div className="text-emerald-400">{data.buy_zone}</div></div>
            <div className="glass-card p-3"><div className="text-zinc-500">Target</div><div>{data.target_price}</div></div>
          </div>
          <p className="text-xs text-zinc-500">Sector health: {data.sector_health}</p>
          {data.investment_plan?.map((s, i) => <div key={i} className="text-xs text-zinc-400">→ {s}</div>)}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div><div className="text-[10px] text-emerald-500 uppercase mb-1">Catalysts</div>{data.catalysts.map((c, i) => <div key={i} className="text-xs text-zinc-400">+ {c}</div>)}</div>
            <div><div className="text-[10px] text-red-400 uppercase mb-1">Risks</div>{data.risks.map((r, i) => <div key={i} className="text-xs text-zinc-400">! {r}</div>)}</div>
          </div>
        </AiInsightPanel>
      )}
    </PowerAppLayout>
  );
}

export function IpoHubApp() {
  const { ipoFilter, ipoCategory, ipoBudget, setIpoFilter, setIpoCategory, setIpoBudget } = usePowerSettingsStore();
  const [data, setData] = useState<IpoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/power/ipo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filter: ipoFilter, category: ipoCategory, budget: ipoBudget }) });
      const json = await res.json();
      if (!json.success) setError(json.error || 'Failed');
      else setData(json.data);
    } catch { setError('Network error'); } finally { setLoading(false); }
  }, [ipoFilter, ipoCategory, ipoBudget]);

  return (
    <PowerAppLayout title={ipoMeta.title} subtitle={ipoMeta.subtitle} icon={ipoMeta.icon} path={ipoMeta.path} settings={
      <div className="space-y-3">
        <div className="flex gap-2">
          {(['upcoming', 'recent'] as const).map((f) => (
            <button key={f} onClick={() => setIpoFilter(f)} className={`flex-1 py-2 text-xs rounded-xl border transition-colors ${ipoFilter === f ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'border-white/10 text-zinc-500'}`}>
              {f === 'upcoming' ? 'Open / Upcoming' : 'Recently Listed'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase">Category</label>
            <select value={ipoCategory} onChange={(e) => setIpoCategory(e.target.value as 'retail' | 'hni')} className="input-field mt-1 py-2 text-xs">
              <option value="retail">Retail</option>
              <option value="hni">HNI</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase">Budget (₹)</label>
            <input type="number" value={ipoBudget} onChange={(e) => setIpoBudget(e.target.value)} className="input-field mt-1 py-2 text-xs" />
          </div>
        </div>
        <RunButton loading={loading} onClick={run} />
      </div>
    }>
      {error && <ErrorBox error={error} />}
      {data && (
        <div className="space-y-4">
          <AiInsightPanel plainSummary={data.plain_summary} indicatorExplanation={data.indicator_explanation} logicSteps={data.logic_steps}>
            <p className="text-xs text-zinc-500">{data.market_context}</p>
          </AiInsightPanel>
          {data.ipos.map((ipo, i) => (
            <div key={i} className="glass-card p-4 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="font-medium text-sm">{ipo.name}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                  ipo.action === 'Accumulate for Long-Term Value' ? 'bg-emerald-500/15 text-emerald-400' :
                  ipo.action === 'Apply for Short-Term Listing Gains' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-red-500/15 text-red-400'
                }`}>{ipo.action}</span>
              </div>
              <p className="text-xs text-zinc-400">{ipo.summary}</p>
              <p className="text-xs text-zinc-300">{ipo.rationale}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div><span className="text-emerald-500">Pros</span>{ipo.pros.map((p, j) => <div key={j} className="text-zinc-500">+ {p}</div>)}</div>
                <div><span className="text-red-400">Cons</span>{ipo.cons.map((c, j) => <div key={j} className="text-zinc-500">− {c}</div>)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PowerAppLayout>
  );
}
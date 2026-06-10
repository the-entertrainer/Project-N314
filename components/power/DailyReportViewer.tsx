'use client';

import type { DailyReport } from '../../types/dailyReport';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-emerald-400 border-b border-emerald-500/20 pb-2">{title}</h3>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="bg-zinc-900/50 rounded-xl px-3 py-2">
      <div className="text-[10px] text-zinc-500">{label}</div>
      <div className="font-mono text-sm text-zinc-200">{value ?? '—'}</div>
    </div>
  );
}

function DashList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {item}
        </span>
      ))}
    </div>
  );
}

export default function DailyReportViewer({ report }: { report: DailyReport }) {
  const es = report.executive_summary;
  const mo = report.market_overview;

  return (
    <div className="space-y-4 text-sm">
      <div className="glass-card p-4 bg-gradient-to-br from-emerald-500/10 to-transparent">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Institutional Daily Report</div>
        <div className="text-lg font-semibold mt-1">{report.report_date}</div>
        <div className="text-xs text-zinc-400 mt-1">
          Confidence {report.confidence_score}/100 · {report.data_sources.join(' · ')}
        </div>
      </div>

      <Section title="1. Executive Summary">
        <p className="text-zinc-300 leading-relaxed">{es.summary}</p>
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Sentiment" value={es.market_sentiment.slice(0, 40)} />
          <Metric label="Best Sector" value={es.best_sector} />
          <Metric label="Best Stock" value={es.best_stock} />
          <Metric label="Best F&O" value={es.best_fno_trade} />
        </div>
        <div className="text-xs text-zinc-400">
          <div className="text-red-400/80 mb-1">Risks</div>
          {es.major_risks.map((r) => <div key={r}>• {r}</div>)}
        </div>
      </Section>

      <Section title="2. Market Overview">
        <div className="grid grid-cols-2 gap-2">
          <Metric label="Nifty" value={mo.nifty_close?.toLocaleString('en-IN') ?? null} />
          <Metric label="Bank Nifty" value={mo.bank_nifty_close?.toLocaleString('en-IN') ?? null} />
          <Metric label="Sensex" value={mo.sensex_close?.toLocaleString('en-IN') ?? null} />
          <Metric label="India VIX" value={mo.india_vix?.toFixed(2) ?? null} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">Bullish {mo.next_day.bullish_pct}%</div>
          <div className="rounded-xl bg-zinc-800 p-2 text-zinc-400">Neutral {mo.next_day.neutral_pct}%</div>
          <div className="rounded-xl bg-red-500/10 p-2 text-red-400">Bearish {mo.next_day.bearish_pct}%</div>
        </div>
        <p className="text-xs text-zinc-400">{mo.breadth_analysis}</p>
        <p className="text-xs text-zinc-500">Weekly: {mo.weekly_outlook.range} — {mo.weekly_outlook.targets}</p>
      </Section>

      <Section title="3. FII & DII Analysis">
        <div className="grid grid-cols-2 gap-2">
          <Metric label="FII Net (₹ Cr)" value={report.fii_dii_analysis.fii_net_cr} />
          <Metric label="DII Net (₹ Cr)" value={report.fii_dii_analysis.dii_net_cr} />
        </div>
        <p className="text-xs text-zinc-300">{report.fii_dii_analysis.smart_money}</p>
        <p className="text-xs text-zinc-400">{report.fii_dii_analysis.next_session_impact}</p>
      </Section>

      <Section title="4. Top 200 Screening">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-zinc-500 border-b border-white/5">
                <th className="text-left py-1 pr-2">#</th>
                <th className="text-left py-1 pr-2">Stock</th>
                <th className="text-left py-1 pr-2">CMP</th>
                <th className="text-left py-1">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {report.top_200.slice(0, 30).map((r) => (
                <tr key={r.rank} className="border-b border-white/5 text-zinc-400">
                  <td className="py-1 pr-2">{r.rank}</td>
                  <td className="py-1 pr-2 truncate max-w-[120px]">{r.stock}</td>
                  <td className="py-1 pr-2 font-mono">{r.cmp != null ? `₹${r.cmp}` : '—'}</td>
                  <td className="py-1 text-emerald-400">{r.conviction_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-zinc-600">Showing top 30 of 200. Download PDF for extended table.</p>
      </Section>

      <Section title="5. Top 25 High-Conviction">
        {report.top_25.map((s) => (
          <div key={s.symbol} className="border border-white/5 rounded-xl p-3 space-y-1">
            <div className="flex justify-between gap-2">
              <span className="font-medium text-zinc-200">{s.stock}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">
                {s.recommendation}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500">{s.sector} · Conviction {s.conviction_score}/10</p>
            <p className="text-xs text-zinc-400">{s.business_overview}</p>
            <p className="text-[10px] text-zinc-500">
              Buy {s.investment_plan.buy_zone} · SL {s.investment_plan.stop_loss} · 1Y {s.investment_plan.target_1y}
            </p>
          </div>
        ))}
      </Section>

      <Section title="6. F&O Opportunities">
        {report.fno_opportunities.map((f) => (
          <div key={`${f.symbol}-${f.strategy}`} className="text-xs border-b border-white/5 pb-2">
            <div className="font-mono text-emerald-400">{f.symbol}</div>
            <div className="text-zinc-400">{f.strategy} · {f.success_probability}% prob · R:R {f.risk_reward}</div>
            <div className="text-[10px] text-zinc-500">Entry {f.entry} → {f.target_1} · SL {f.stop_loss}</div>
          </div>
        ))}
      </Section>

      <Section title="7. Nifty Strategies">
        {report.nifty_strategies.map((n) => (
          <div key={n.name} className="text-xs text-zinc-400 border-b border-white/5 pb-2">
            <div className="text-zinc-200 font-medium">{n.name}</div>
            <div>{n.entry_condition}</div>
            <div className="text-[10px] text-zinc-500">R:R {n.risk_reward} · Confidence {n.confidence}/10</div>
          </div>
        ))}
      </Section>

      <Section title="8. Sector Leadership">
        {report.sector_leadership.map((s) => (
          <div key={s.sector} className="flex justify-between text-xs text-zinc-400 border-b border-white/5 py-1">
            <span>#{s.rank} {s.sector}</span>
            <span className="text-zinc-500 truncate max-w-[50%]">{s.growth_outlook}</span>
          </div>
        ))}
        <p className="text-[10px] text-emerald-400">1M: {report.best_sector_1m} · 1Y: {report.best_sector_1y} · 5Y: {report.best_sector_5y}</p>
      </Section>

      <Section title="9. IPO Research">
        {report.ipo_research.map((i) => (
          <div key={i.symbol} className="text-xs border-b border-white/5 pb-2">
            <div className="flex justify-between">
              <span className="text-zinc-200">{i.name}</span>
              <span className="text-emerald-400">{i.recommendation}</span>
            </div>
            <p className="text-zinc-500">{i.summary}</p>
          </div>
        ))}
      </Section>

      <Section title="10. Actionable Dashboard">
        <div className="space-y-2 text-xs">
          <div><span className="text-zinc-500">Long-Term Buys</span><DashList items={report.actionable_dashboard.long_term_buys} /></div>
          <div><span className="text-zinc-500">Swing Trades</span><DashList items={report.actionable_dashboard.swing_trades} /></div>
          <div><span className="text-zinc-500">F&O Trades</span><DashList items={report.actionable_dashboard.fno_trades} /></div>
          <div><span className="text-zinc-500">Low Risk</span><DashList items={report.actionable_dashboard.low_risk} /></div>
        </div>
      </Section>

      <Section title="11. Best Ideas of the Day">
        {Object.entries(report.best_ideas).map(([key, idea]) => (
          <div key={key} className="text-xs border border-white/5 rounded-xl p-3">
            <div className="font-medium text-zinc-200">{idea.title}</div>
            <p className="text-zinc-400 mt-1">{idea.why}</p>
            <p className="text-[10px] text-zinc-500 mt-1">
              {idea.entry_or_buy_zone} → {idea.target} · SL {idea.stop_loss}
            </p>
          </div>
        ))}
      </Section>

      <p className="text-[10px] text-zinc-600 leading-relaxed pb-4">{report.risk_disclaimer}</p>
    </div>
  );
}
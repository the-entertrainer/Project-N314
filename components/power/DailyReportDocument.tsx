'use client';

import type { DailyReport } from '../../types/dailyReport';

function Sheet({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`report-sheet ${className}`}>
      {children}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="report-h2">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="report-p">{children}</p>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="report-table">
      <thead>
        <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DailyReportDocument({ report }: { report: DailyReport }) {
  const es = report.executive_summary;
  const mo = report.market_overview;
  const fii = report.fii_dii_analysis;

  return (
    <div id="daily-report-print" className="report-document">
      {/* Cover */}
      <Sheet className="report-cover">
        <div className="report-brand">N314</div>
        <div className="report-cover-title">Daily Institutional Market Intelligence</div>
        <div className="report-cover-sub">& Opportunity Report</div>
        <div className="report-cover-meta">
          <div>Report Date: {report.report_date}</div>
          <div>Generated: {new Date(report.generated_at).toLocaleString('en-IN')}</div>
          <div>Confidence Score: {report.confidence_score}/100</div>
        </div>
        <div className="report-cover-sources">Sources: {report.data_sources.join(' · ')}</div>
        <div className="report-cover-footer">Equity · F&O · Portfolio · IPO Research</div>
      </Sheet>

      {/* Section 1 */}
      <Sheet>
        <H2>1. Executive Summary</H2>
        <P>{es.summary}</P>
        <div className="report-kpi-grid">
          <div className="report-kpi"><span>Sentiment</span><strong>{es.market_sentiment.slice(0, 80)}</strong></div>
          <div className="report-kpi"><span>Best Stock</span><strong>{es.best_stock}</strong></div>
          <div className="report-kpi"><span>Best F&O</span><strong>{es.best_fno_trade}</strong></div>
          <div className="report-kpi"><span>Best Sector</span><strong>{es.best_sector}</strong></div>
        </div>
        <P><strong>Nifty:</strong> {es.nifty_outlook}</P>
        <P><strong>Bank Nifty:</strong> {es.bank_nifty_outlook}</P>
        <div className="report-tag-list">
          <span className="report-label">Top Opportunities</span>
          {es.top_opportunities.map((o) => <span key={o} className="report-tag">{o}</span>)}
        </div>
        <div className="report-tag-list report-risks">
          <span className="report-label">Major Risks</span>
          {es.major_risks.map((r) => <span key={r} className="report-tag">{r}</span>)}
        </div>
      </Sheet>

      {/* Section 2 */}
      <Sheet>
        <H2>2. Market Overview</H2>
        <Table
          headers={['Index', 'Close', 'Outlook']}
          rows={[
            ['Nifty 50', mo.nifty_close?.toLocaleString('en-IN') ?? '—', es.nifty_outlook.slice(0, 60)],
            ['Bank Nifty', mo.bank_nifty_close?.toLocaleString('en-IN') ?? '—', ''],
            ['Sensex', mo.sensex_close?.toLocaleString('en-IN') ?? '—', ''],
            ['India VIX', mo.india_vix?.toFixed(2) ?? '—', ''],
          ]}
        />
        <div className="report-prob-bar">
          <div className="report-prob bullish" style={{ width: `${mo.next_day.bullish_pct}%` }}>Bull {mo.next_day.bullish_pct}%</div>
          <div className="report-prob neutral" style={{ width: `${mo.next_day.neutral_pct}%` }}>Neu {mo.next_day.neutral_pct}%</div>
          <div className="report-prob bearish" style={{ width: `${mo.next_day.bearish_pct}%` }}>Bear {mo.next_day.bearish_pct}%</div>
        </div>
        <P>{mo.breadth_analysis}</P>
        <P><strong>Weekly:</strong> {mo.weekly_outlook.range} — {mo.weekly_outlook.targets}</P>
      </Sheet>

      {/* Section 3 */}
      <Sheet>
        <H2>3. FII & DII Analysis</H2>
        <Table
          headers={['Participant', 'Net (₹ Cr)', 'Source']}
          rows={[
            ['FII', String(fii.fii_net_cr), 'NSE India'],
            ['DII', String(fii.dii_net_cr), 'NSE India'],
          ]}
        />
        <P>{fii.smart_money}</P>
        <P>{fii.cash_activity}</P>
        <P><strong>Next session:</strong> {fii.next_session_impact}</P>
      </Sheet>

      {/* Section 4 */}
      <Sheet>
        <H2>4. Top 200 Equity Screening</H2>
        <Table
          headers={['#', 'Stock', 'Sector', 'CMP', 'Conv.', 'Risk']}
          rows={report.top_200.slice(0, 40).map((r) => [
            String(r.rank),
            r.stock.length > 28 ? r.stock.slice(0, 28) + '…' : r.stock,
            r.sector.length > 16 ? r.sector.slice(0, 16) + '…' : r.sector,
            r.cmp != null ? `₹${r.cmp}` : '—',
            String(r.conviction_score),
            String(r.risk_score),
          ])}
        />
        <p className="report-note">Showing top 40 of 200 ranked names. Full list in N314 app.</p>
      </Sheet>

      {/* Section 5 */}
      <Sheet>
        <H2>5. Top 25 High-Conviction Stocks</H2>
        {report.top_25.map((s) => (
          <div key={s.symbol} className="report-stock-block">
            <div className="report-stock-head">
              <strong>{s.stock}</strong>
              <span className={`report-badge ${s.recommendation.toLowerCase().replace(' ', '-')}`}>{s.recommendation}</span>
            </div>
            <div className="report-stock-meta">{s.symbol} · {s.sector} · Conviction {s.conviction_score}/10</div>
            <P>{s.business_overview}</P>
            <P><strong>Technical:</strong> {s.technical_view}</P>
            <P><strong>Plan:</strong> Buy {s.investment_plan.buy_zone} · SL {s.investment_plan.stop_loss} · 1Y {s.investment_plan.target_1y}</P>
          </div>
        ))}
      </Sheet>

      {/* Section 6 */}
      <Sheet>
        <H2>6. F&O Opportunities</H2>
        <Table
          headers={['Symbol', 'Trend', 'Strategy', 'Entry', 'T1', 'SL', 'Prob%']}
          rows={report.fno_opportunities.map((f) => [
            f.symbol, f.trend.slice(0, 20), f.strategy.slice(0, 22), f.entry, f.target_1, f.stop_loss, String(f.success_probability),
          ])}
        />
      </Sheet>

      {/* Section 7 */}
      <Sheet>
        <H2>7. Nifty Strategies</H2>
        {report.nifty_strategies.map((n) => (
          <div key={n.name} className="report-stock-block">
            <strong>{n.name}</strong>
            <P>{n.entry_condition}</P>
            <div className="report-stock-meta">R:R {n.risk_reward} · Prob {n.probability} · Confidence {n.confidence}/10</div>
          </div>
        ))}
      </Sheet>

      {/* Section 8-11 */}
      <Sheet>
        <H2>8. Sector Leadership</H2>
        <Table
          headers={['Rank', 'Sector', 'Growth Outlook']}
          rows={report.sector_leadership.map((s) => [String(s.rank), s.sector, s.growth_outlook])}
        />
        <P>Best 1M: {report.best_sector_1m} · 1Y: {report.best_sector_1y} · 5Y: {report.best_sector_5y}</P>

        <H2>9. IPO Research</H2>
        <Table
          headers={['IPO', 'Status', 'Rec.', 'Summary']}
          rows={report.ipo_research.map((i) => [i.name.slice(0, 24), i.status, i.recommendation, i.summary.slice(0, 50)])}
        />

        <H2>10. Actionable Dashboard</H2>
        <Table
          headers={['Category', 'Picks']}
          rows={[
            ['Long-Term Buys', report.actionable_dashboard.long_term_buys.join(', ')],
            ['Swing Trades', report.actionable_dashboard.swing_trades.join(', ')],
            ['F&O Trades', report.actionable_dashboard.fno_trades.join(', ')],
            ['Low Risk', report.actionable_dashboard.low_risk.join(', ')],
          ]}
        />

        <H2>11. Best Ideas of the Day</H2>
        {Object.entries(report.best_ideas).map(([k, idea]) => (
          <div key={k} className="report-stock-block">
            <strong>{idea.title}</strong>
            <P>{idea.why}</P>
            <div className="report-stock-meta">{idea.entry_or_buy_zone} → {idea.target} · SL {idea.stop_loss}</div>
          </div>
        ))}

        <p className="report-disclaimer">{report.risk_disclaimer}</p>
      </Sheet>
    </div>
  );
}

export function printDailyReport() {
  window.print();
}
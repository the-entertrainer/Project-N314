import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DailyReport } from '../types/dailyReport';

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text(title, 14, y);
  doc.setDrawColor(16, 185, 129);
  doc.line(14, y + 2, 196, y + 2);
  return y + 10;
}

function addBody(doc: jsPDF, text: string, y: number, maxWidth = 182) {
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, 14, y);
  return y + lines.length * 4.5 + 4;
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  if (y + needed > 280) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function downloadDailyReportPdf(report: DailyReport) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;

  // Cover
  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('N314', 14, 40);
  doc.setFontSize(16);
  doc.text('Daily Institutional Market Intelligence', 14, 55);
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('& Opportunity Report', 14, 63);
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(10);
  doc.text(`Report Date: ${report.report_date}`, 14, 80);
  doc.text(`Generated: ${new Date(report.generated_at).toLocaleString('en-IN')}`, 14, 87);
  doc.text(`Confidence Score: ${report.confidence_score}/100`, 14, 94);
  doc.text(`Sources: ${report.data_sources.join(', ')}`, 14, 101);
  doc.setFontSize(8);
  doc.text(
    'Professional Equity · F&O · Portfolio · IPO Research',
    14,
    115
  );

  doc.addPage();
  y = 20;

  y = addSectionTitle(doc, '1. Executive Summary', y);
  const es = report.executive_summary;
  y = addBody(doc, es.summary || es.market_sentiment, y);
  y = addBody(doc, `Sentiment: ${es.market_sentiment}`, y);
  y = addBody(doc, `Nifty: ${es.nifty_outlook}`, y);
  y = addBody(doc, `Bank Nifty: ${es.bank_nifty_outlook}`, y);
  y = addBody(doc, `Best Stock: ${es.best_stock} | Best F&O: ${es.best_fno_trade}`, y);
  y = addBody(doc, `Best Nifty Strategy: ${es.best_nifty_strategy} | Best Sector: ${es.best_sector}`, y);

  y = ensureSpace(doc, y, 40);
  y = addSectionTitle(doc, '2. Market Overview', y);
  const mo = report.market_overview;
  autoTable(doc, {
    startY: y,
    head: [['Index', 'Close']],
    body: [
      ['Nifty 50', mo.nifty_close?.toLocaleString('en-IN') ?? '—'],
      ['Bank Nifty', mo.bank_nifty_close?.toLocaleString('en-IN') ?? '—'],
      ['Sensex', mo.sensex_close?.toLocaleString('en-IN') ?? '—'],
      ['India VIX', mo.india_vix?.toFixed(2) ?? '—'],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  y = addBody(
    doc,
    `Next-Day Outlook — Bullish ${mo.next_day.bullish_pct}% | Neutral ${mo.next_day.neutral_pct}% | Bearish ${mo.next_day.bearish_pct}%`,
    y
  );
  y = addBody(doc, `Weekly: ${mo.weekly_outlook.range} | Targets: ${mo.weekly_outlook.targets}`, y);
  y = addBody(doc, mo.breadth_analysis, y);

  y = ensureSpace(doc, y, 50);
  y = addSectionTitle(doc, '3. FII & DII Analysis', y);
  const fii = report.fii_dii_analysis;
  autoTable(doc, {
    startY: y,
    head: [['Flow', 'Net (₹ Cr)']],
    body: [
      ['FII Net', String(fii.fii_net_cr)],
      ['DII Net', String(fii.dii_net_cr)],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  y = addBody(doc, fii.smart_money, y);
  y = addBody(doc, fii.next_session_impact, y);

  doc.addPage();
  y = 20;
  y = addSectionTitle(doc, '4. Top 200 Equity Screening (Summary)', y);
  autoTable(doc, {
    startY: y,
    head: [['Rank', 'Stock', 'Sector', 'CMP', 'Conv.', 'Risk']],
    body: report.top_200.slice(0, 50).map((r) => [
      String(r.rank),
      r.stock.slice(0, 28),
      r.sector.slice(0, 18),
      r.cmp != null ? `₹${r.cmp}` : '—',
      String(r.conviction_score),
      String(r.risk_score),
    ]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [16, 185, 129] },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Showing top 50 of 200. Full table available in app.', 14, y + 4);

  doc.addPage();
  y = 20;
  y = addSectionTitle(doc, '5. Top 25 High-Conviction Stocks', y);
  for (const stock of report.top_25.slice(0, 25)) {
    y = ensureSpace(doc, y, 45);
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`${stock.stock} (${stock.symbol}) — ${stock.recommendation} [${stock.conviction_score}/10]`, 14, y);
    y += 6;
    y = addBody(doc, stock.business_overview, y);
    y = addBody(doc, `Technical: ${stock.technical_view}`, y);
    y = addBody(
      doc,
      `Plan: Buy ${stock.investment_plan.buy_zone} | SL ${stock.investment_plan.stop_loss} | 1Y ${stock.investment_plan.target_1y}`,
      y
    );
    y += 2;
  }

  doc.addPage();
  y = 20;
  y = addSectionTitle(doc, '6. F&O Opportunities', y);
  autoTable(doc, {
    startY: y,
    head: [['Symbol', 'Strategy', 'Entry', 'Target', 'SL', 'Prob%']],
    body: report.fno_opportunities.map((f) => [
      f.symbol,
      f.strategy.slice(0, 24),
      f.entry,
      f.target_1,
      f.stop_loss,
      String(f.success_probability),
    ]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [16, 185, 129] },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  y = addSectionTitle(doc, '7. Nifty Strategies', y);
  autoTable(doc, {
    startY: y,
    head: [['Strategy', 'Condition', 'R:R', 'Confidence']],
    body: report.nifty_strategies.map((n) => [
      n.name.slice(0, 30),
      n.entry_condition.slice(0, 35),
      n.risk_reward,
      String(n.confidence),
    ]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [16, 185, 129] },
  });

  doc.addPage();
  y = 20;
  y = addSectionTitle(doc, '8. Sector Leadership', y);
  autoTable(doc, {
    startY: y,
    head: [['Rank', 'Sector', 'Growth Outlook']],
    body: report.sector_leadership.map((s) => [
      String(s.rank),
      s.sector,
      s.growth_outlook.slice(0, 50),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  y = addBody(doc, `Best 1M: ${report.best_sector_1m} | 1Y: ${report.best_sector_1y} | 5Y: ${report.best_sector_5y}`, y);

  y = ensureSpace(doc, y, 40);
  y = addSectionTitle(doc, '9. IPO Research', y);
  autoTable(doc, {
    startY: y,
    head: [['IPO', 'Rec.', 'Scores (F/B/V)', 'Summary']],
    body: report.ipo_research.map((i) => [
      i.name.slice(0, 22),
      i.recommendation,
      `${i.financial_strength}/${i.business_quality}/${i.valuation_score}`,
      i.summary.slice(0, 40),
    ]),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [16, 185, 129] },
  });

  doc.addPage();
  y = 20;
  y = addSectionTitle(doc, '10. Actionable Dashboard', y);
  const dash = report.actionable_dashboard;
  const dashRows = [
    ['Long-Term Buys', dash.long_term_buys.join(', ')],
    ['Swing Trades', dash.swing_trades.join(', ')],
    ['F&O Trades', dash.fno_trades.join(', ')],
    ['Low Risk', dash.low_risk.join(', ')],
  ];
  autoTable(doc, {
    startY: y,
    body: dashRows,
    styles: { fontSize: 8 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  y = addSectionTitle(doc, '11. Best Ideas of the Day', y);
  const ideas = report.best_ideas;
  for (const [label, idea] of Object.entries(ideas)) {
    y = ensureSpace(doc, y, 25);
    y = addBody(doc, `${label}: ${idea.title} — ${idea.why}`, y);
    y = addBody(doc, `Entry: ${idea.entry_or_buy_zone} | Target: ${idea.target} | SL: ${idea.stop_loss}`, y);
  }

  y = ensureSpace(doc, y, 20);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(report.risk_disclaimer, 14, y, { maxWidth: 182 });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`N314 Daily Report · ${report.report_date} · Page ${i}/${pageCount}`, 14, 290);
  }

  doc.save(`N314-Daily-Report-${report.report_date}.pdf`);
}
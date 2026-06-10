import ExcelJS from 'exceljs';
import type { BestIdea, DailyReport } from '../types/dailyReport';

const C = {
  emerald: 'FF10B981',
  emeraldDark: 'FF047857',
  emeraldMid: 'FF059669',
  emeraldLight: 'FFD1FAE5',
  emeraldPale: 'FFECFDF5',
  navy: 'FF09090B',
  white: 'FFFFFFFF',
  black: 'FF000000',
  zinc50: 'FFFAFAFA',
  zinc100: 'FFF4F4F5',
  zinc200: 'FFE4E4E7',
  zinc400: 'FFA1A1AA',
  zinc600: 'FF52525B',
  zinc700: 'FF3F3F46',
  zinc800: 'FF27272A',
  zinc900: 'FF18181B',
  green: 'FF16A34A',
  greenLight: 'FFDCFCE7',
  red: 'FFDC2626',
  redLight: 'FFFEE2E2',
  amber: 'FFD97706',
  amberLight: 'FFFEF3C7',
  blue: 'FF2563EB',
  blueLight: 'FFDBEAFE',
  purple: 'FF7C3AED',
  purpleLight: 'FFEDE9FE',
};

const FONT = 'Arial';

function solidFill(color: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
}

function thinBorder(color = C.zinc200): Partial<ExcelJS.Borders> {
  const s: ExcelJS.BorderStyle = 'thin';
  const c = { argb: color };
  return { top: { style: s, color: c }, left: { style: s, color: c }, bottom: { style: s, color: c }, right: { style: s, color: c } };
}

function setCell(
  cell: ExcelJS.Cell,
  value: ExcelJS.CellValue,
  opts?: {
    bold?: boolean;
    size?: number;
    color?: string;
    bg?: string;
    align?: 'left' | 'center' | 'right';
    wrap?: boolean;
    border?: boolean;
  }
) {
  cell.value = value;
  cell.font = {
    name: FONT,
    size: opts?.size ?? 10,
    bold: opts?.bold,
    color: opts?.color ? { argb: opts.color } : undefined,
  };
  if (opts?.bg) cell.fill = solidFill(opts.bg);
  if (opts?.align || opts?.wrap) {
    cell.alignment = { horizontal: opts.align ?? 'left', vertical: 'middle', wrapText: opts?.wrap };
  }
  if (opts?.border) cell.border = thinBorder();
}

function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNum: number, colCount: number) {
  const row = sheet.getRow(rowNum);
  row.height = 28;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: C.white } };
    cell.fill = solidFill(C.emeraldDark);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder(C.emeraldMid);
  }
}

function zebraRow(row: ExcelJS.Row, even: boolean, colCount: number) {
  row.height = 20;
  const bg = even ? C.zinc50 : C.white;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    if (!cell.fill || (cell.fill as ExcelJS.FillPattern).fgColor?.argb === undefined) {
      cell.fill = solidFill(bg);
    }
    cell.font = { name: FONT, size: 10, color: { argb: C.black } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = thinBorder(C.zinc200);
  }
}

function scoreFill(score: number, max: number, invert = false): string {
  const pct = score / max;
  const v = invert ? 1 - pct : pct;
  if (v >= 0.7) return C.greenLight;
  if (v >= 0.45) return C.amberLight;
  return C.redLight;
}

function recFill(rec: string): string {
  const r = rec.toLowerCase();
  if (r.includes('strong buy') || r.includes('strong apply')) return C.greenLight;
  if (r === 'buy' || r === 'apply') return C.emeraldPale;
  if (r === 'hold' || r === 'neutral') return C.amberLight;
  return C.redLight;
}

function recFont(rec: string): string {
  const r = rec.toLowerCase();
  if (r.includes('strong buy') || r.includes('strong apply')) return C.green;
  if (r === 'buy' || r === 'apply') return C.emeraldDark;
  if (r === 'hold' || r === 'neutral') return C.amber;
  return C.red;
}

function flowFill(value: number): string {
  if (value > 0) return C.greenLight;
  if (value < 0) return C.redLight;
  return C.zinc100;
}

function sectionTitle(sheet: ExcelJS.Worksheet, row: number, title: string, cols = 6) {
  sheet.mergeCells(row, 1, row, cols);
  const cell = sheet.getCell(row, 1);
  setCell(cell, title, { bold: true, size: 13, color: C.white, bg: C.emeraldDark, align: 'left' });
  sheet.getRow(row).height = 32;
}

function kpiBlock(sheet: ExcelJS.Worksheet, startRow: number, startCol: number, label: string, value: string) {
  sheet.mergeCells(startRow, startCol, startRow, startCol + 1);
  sheet.mergeCells(startRow + 1, startCol, startRow + 1, startCol + 1);
  setCell(sheet.getCell(startRow, startCol), label, { size: 9, color: C.zinc600, bg: C.emeraldPale, align: 'center' });
  setCell(sheet.getCell(startRow + 1, startCol), value, { bold: true, size: 11, color: C.emeraldDark, bg: C.emeraldPale, align: 'center', wrap: true });
  sheet.getRow(startRow).height = 18;
  sheet.getRow(startRow + 1).height = 36;
}

function buildSummarySheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('Summary', { views: [{ showGridLines: false }] });
  sheet.properties.defaultColWidth = 14;
  sheet.getColumn(1).width = 4;
  sheet.getColumn(2).width = 22;
  sheet.getColumn(3).width = 22;
  sheet.getColumn(4).width = 22;
  sheet.getColumn(5).width = 22;
  sheet.getColumn(6).width = 4;

  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= 6; c++) {
      sheet.getCell(r, c).fill = solidFill(C.navy);
    }
  }
  sheet.mergeCells('B1:E1');
  setCell(sheet.getCell('B1'), 'N314', { bold: true, size: 28, color: C.emerald, bg: C.navy, align: 'center' });
  sheet.mergeCells('B2:E2');
  setCell(sheet.getCell('B2'), 'Daily Institutional Market Intelligence', { bold: true, size: 16, color: C.white, bg: C.navy, align: 'center' });
  sheet.mergeCells('B3:E3');
  setCell(sheet.getCell('B3'), '& Opportunity Report', { size: 12, color: C.emerald, bg: C.navy, align: 'center' });

  let row = 5;
  const meta: [string, string][] = [
    ['Report Date', report.report_date],
    ['Generated', new Date(report.generated_at).toLocaleString('en-IN')],
    ['Confidence Score', `${report.confidence_score} / 100`],
    ['Data Sources', report.data_sources.join(' · ')],
  ];
  for (const [label, val] of meta) {
    sheet.mergeCells(row, 2, row, 3);
    sheet.mergeCells(row, 4, row, 5);
    setCell(sheet.getCell(row, 2), label, { bold: true, size: 10, color: C.zinc700, bg: C.zinc100 });
    setCell(sheet.getCell(row, 4), val, { size: 10, color: C.black, bg: C.white, wrap: true });
    sheet.getRow(row).height = 22;
    row++;
  }

  row += 1;
  sectionTitle(sheet, row, 'Executive Summary', 6);
  row += 1;
  sheet.mergeCells(row, 2, row + 2, 5);
  setCell(sheet.getCell(row, 2), report.executive_summary.summary, { size: 10, wrap: true, bg: C.emeraldPale });
  sheet.getRow(row).height = 60;
  row += 4;

  kpiBlock(sheet, row, 2, 'Market Sentiment', report.executive_summary.market_sentiment.slice(0, 60));
  kpiBlock(sheet, row, 4, 'Best Stock', report.executive_summary.best_stock);
  row += 3;
  kpiBlock(sheet, row, 2, 'Best F&O Trade', report.executive_summary.best_fno_trade);
  kpiBlock(sheet, row, 4, 'Best Sector', report.executive_summary.best_sector);
  row += 4;

  sectionTitle(sheet, row, 'Index Outlook', 6);
  row++;
  sheet.mergeCells(row, 2, row, 5);
  setCell(sheet.getCell(row, 2), `Nifty: ${report.executive_summary.nifty_outlook}`, { wrap: true, bg: C.zinc50 });
  row++;
  sheet.mergeCells(row, 2, row, 5);
  setCell(sheet.getCell(row, 2), `Bank Nifty: ${report.executive_summary.bank_nifty_outlook}`, { wrap: true, bg: C.white });
  row += 2;

  sectionTitle(sheet, row, 'Top Opportunities', 6);
  row++;
  report.executive_summary.top_opportunities.forEach((o, i) => {
    sheet.mergeCells(row, 2, row, 5);
    setCell(sheet.getCell(row, 2), `${i + 1}. ${o}`, { bg: i % 2 === 0 ? C.emeraldPale : C.white });
    row++;
  });
  row++;

  sectionTitle(sheet, row, 'Major Risks', 6);
  row++;
  report.executive_summary.major_risks.forEach((r, i) => {
    sheet.mergeCells(row, 2, row, 5);
    setCell(sheet.getCell(row, 2), `⚠ ${r}`, { color: C.red, bg: i % 2 === 0 ? C.redLight : C.white, wrap: true });
    row++;
  });
  row++;

  sheet.mergeCells(row, 2, row + 1, 5);
  setCell(sheet.getCell(row, 2), report.risk_disclaimer, { size: 8, color: C.zinc600, wrap: true, bg: C.zinc100 });
}

function buildMarketSheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('Market Overview');
  const mo = report.market_overview;
  const es = report.executive_summary;

  sectionTitle(sheet, 1, 'Market Overview', 4);
  const headers = ['Index', 'Close', 'Outlook / Notes'];
  const hRow = 3;
  headers.forEach((h, i) => { sheet.getCell(hRow, i + 1).value = h; });
  styleHeaderRow(sheet, hRow, 3);

  const indexRows: [string, string, string][] = [
    ['Nifty 50', mo.nifty_close?.toLocaleString('en-IN') ?? '—', es.nifty_outlook],
    ['Bank Nifty', mo.bank_nifty_close?.toLocaleString('en-IN') ?? '—', es.bank_nifty_outlook],
    ['Sensex', mo.sensex_close?.toLocaleString('en-IN') ?? '—', ''],
    ['India VIX', mo.india_vix?.toFixed(2) ?? '—', mo.india_vix != null && mo.india_vix > 18 ? 'Elevated volatility' : 'Normal range'],
  ];
  indexRows.forEach((r, i) => {
    const row = sheet.getRow(hRow + 1 + i);
    r.forEach((v, j) => { row.getCell(j + 1).value = v; });
    zebraRow(row, i % 2 === 0, 3);
  });

  let row = hRow + indexRows.length + 2;
  sectionTitle(sheet, row, 'Next-Day Probability Model', 4);
  row += 2;
  const probs = [
    ['Bullish', `${mo.next_day.bullish_pct}%`, C.greenLight, C.green],
    ['Neutral', `${mo.next_day.neutral_pct}%`, C.amberLight, C.amber],
    ['Bearish', `${mo.next_day.bearish_pct}%`, C.redLight, C.red],
  ];
  probs.forEach(([label, val, bg, fg], i) => {
    setCell(sheet.getCell(row + i, 1), label, { bold: true, bg, color: fg, align: 'center' });
    setCell(sheet.getCell(row + i, 2), val, { bold: true, size: 14, bg, color: fg, align: 'center' });
  });
  row += probs.length + 2;

  const narratives: [string, string][] = [
    ['Advance / Decline', mo.advance_decline],
    ['Breadth Analysis', mo.breadth_analysis],
    ['Institutional Positioning', mo.institutional_positioning],
    ['Sector Rotation', mo.sector_rotation],
    ['Global Impact', mo.global_impact],
    ['Weekly Range', mo.weekly_outlook.range],
    ['Weekly Targets', mo.weekly_outlook.targets],
    ['Weekly Risks', mo.weekly_outlook.risks],
  ];
  narratives.forEach(([label, text], i) => {
    setCell(sheet.getCell(row, 1), label, { bold: true, bg: C.emeraldPale, color: C.emeraldDark });
    sheet.mergeCells(row, 2, row, 4);
    setCell(sheet.getCell(row, 2), text, { wrap: true, bg: i % 2 === 0 ? C.zinc50 : C.white });
    sheet.getRow(row).height = 28;
    row++;
  });

  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 16;
  sheet.getColumn(3).width = 50;
  sheet.views = [{ state: 'frozen', ySplit: 3 }];
}

function buildFiiDiiSheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('FII & DII');
  const fii = report.fii_dii_analysis;

  sectionTitle(sheet, 1, 'FII & DII Institutional Flows', 4);
  const hRow = 3;
  ['Participant', 'Net (₹ Cr)', 'Direction', 'Source'].forEach((h, i) => { sheet.getCell(hRow, i + 1).value = h; });
  styleHeaderRow(sheet, hRow, 4);

  const flows: [string, number][] = [['FII', fii.fii_net_cr], ['DII', fii.dii_net_cr]];
  flows.forEach(([name, net], i) => {
    const row = sheet.getRow(hRow + 1 + i);
    row.getCell(1).value = name;
    const netCell = row.getCell(2);
    netCell.value = net;
    netCell.numFmt = '#,##0;(#,##0);"-"';
    setCell(row.getCell(3), net > 0 ? '▲ Net Buying' : net < 0 ? '▼ Net Selling' : '— Flat', {
      bold: true,
      color: net > 0 ? C.green : net < 0 ? C.red : C.zinc600,
      bg: flowFill(net),
      align: 'center',
    });
    row.getCell(4).value = 'NSE India';
    zebraRow(row, i % 2 === 0, 4);
    row.getCell(2).fill = solidFill(flowFill(net));
    row.getCell(2).font = { name: FONT, size: 11, bold: true, color: { argb: net > 0 ? C.green : net < 0 ? C.red : C.black } };
  });

  let row = hRow + flows.length + 2;
  const sections: [string, string][] = [
    ['Smart Money View', fii.smart_money],
    ['Cash Market Activity', fii.cash_activity],
    ['Futures Activity', fii.futures_activity],
    ['Options Activity', fii.options_activity],
    ['Next Session Impact', fii.next_session_impact],
  ];
  sections.forEach(([label, text], i) => {
    setCell(sheet.getCell(row, 1), label, { bold: true, bg: C.emeraldDark, color: C.white });
    sheet.mergeCells(row, 2, row, 4);
    setCell(sheet.getCell(row, 2), text, { wrap: true, bg: i % 2 === 0 ? C.emeraldPale : C.white });
    sheet.getRow(row).height = 30;
    row++;
  });

  if (fii.accumulation_signals.length) {
    row++;
    setCell(sheet.getCell(row, 1), 'Accumulation Signals', { bold: true, bg: C.greenLight, color: C.green });
    sheet.mergeCells(row, 2, row, 4);
    setCell(sheet.getCell(row, 2), fii.accumulation_signals.join(' · '), { bg: C.greenLight });
    row++;
  }
  if (fii.distribution_signals.length) {
    setCell(sheet.getCell(row, 1), 'Distribution Signals', { bold: true, bg: C.redLight, color: C.red });
    sheet.mergeCells(row, 2, row, 4);
    setCell(sheet.getCell(row, 2), fii.distribution_signals.join(' · '), { bg: C.redLight });
  }

  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 14;
  sheet.getColumn(3).width = 18;
  sheet.getColumn(4).width = 14;
}

function buildTop200Sheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('Top 200 Stocks');
  const headers = ['Rank', 'Stock', 'Symbol', 'Sector', 'CMP (₹)', 'Buy Zone', 'Conviction', 'Risk'];
  const hRow = 1;
  headers.forEach((h, i) => { sheet.getCell(hRow, i + 1).value = h; });
  styleHeaderRow(sheet, hRow, headers.length);

  report.top_200.forEach((s, i) => {
    const row = sheet.getRow(hRow + 1 + i);
    const vals = [s.rank, s.stock, s.symbol, s.sector, s.cmp, s.buy_zone, s.conviction_score, s.risk_score];
    vals.forEach((v, j) => { row.getCell(j + 1).value = v; });
    zebraRow(row, i % 2 === 0, headers.length);
    if (s.rank <= 10) {
      row.getCell(1).fill = solidFill(C.emeraldLight);
      row.getCell(1).font = { name: FONT, size: 10, bold: true, color: { argb: C.emeraldDark } };
    }
    row.getCell(7).fill = solidFill(scoreFill(s.conviction_score, 100));
    row.getCell(8).fill = solidFill(scoreFill(s.risk_score, 100, true));
    if (s.cmp != null) row.getCell(5).numFmt = '#,##0.00';
  });

  const widths = [6, 28, 12, 18, 12, 14, 12, 10];
  widths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `H${report.top_200.length + 1}` };
}

function buildTop25Sheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('Top 25 Deep Dive');
  let row = 1;

  report.top_25.forEach((s, idx) => {
    sectionTitle(sheet, row, `${idx + 1}. ${s.stock} (${s.symbol})`, 8);
    row++;
    const metaRow = sheet.getRow(row);
    ['Sector', 'Recommendation', 'Conviction /10', 'Buy Zone', 'Stop Loss', '1Y Target', '3Y Target', 'CAGR'].forEach((h, i) => {
      metaRow.getCell(i + 1).value = h;
    });
    styleHeaderRow(sheet, row, 8);
    row++;
    const dataRow = sheet.getRow(row);
    const vals = [
      s.sector,
      s.recommendation,
      s.conviction_score,
      s.investment_plan.buy_zone,
      s.investment_plan.stop_loss,
      s.investment_plan.target_1y,
      s.investment_plan.target_3y,
      s.investment_plan.expected_cagr,
    ];
    vals.forEach((v, i) => { dataRow.getCell(i + 1).value = v; });
    zebraRow(dataRow, true, 8);
    setCell(dataRow.getCell(2), s.recommendation, {
      bold: true,
      color: recFont(s.recommendation),
      bg: recFill(s.recommendation),
      align: 'center',
    });
    row += 2;

    const details: [string, string][] = [
      ['Business Overview', s.business_overview],
      ['Technical View', s.technical_view],
      ['Valuation View', s.valuation_view],
      ['Why Buy', s.why_buy],
      ['Key Risk', s.key_risk],
      ['Financial Highlights', s.financial_highlights.join(' · ')],
      ['Bull Case', `${s.bull_case.probability} → ${s.bull_case.target}`],
      ['Base Case', `${s.base_case.probability} → ${s.base_case.target}`],
      ['Bear Case', `${s.bear_case.probability} → ${s.bear_case.target}`],
    ];
    details.forEach(([label, text], i) => {
      setCell(sheet.getCell(row, 1), label, { bold: true, size: 9, color: C.emeraldDark, bg: C.emeraldPale });
      sheet.mergeCells(row, 2, row, 8);
      setCell(sheet.getCell(row, 2), text, { size: 9, wrap: true, bg: i % 2 === 0 ? C.zinc50 : C.white });
      sheet.getRow(row).height = 24;
      row++;
    });
    row++;
  });

  sheet.getColumn(1).width = 18;
  sheet.getColumn(2).width = 16;
  for (let c = 3; c <= 8; c++) sheet.getColumn(c).width = 14;
}

function buildFnoSheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('F&O Opportunities');
  const headers = ['Symbol', 'Trend', 'OI Change', 'Strategy', 'Entry', 'Target 1', 'Target 2', 'Stop Loss', 'R:R', 'Prob %'];
  const hRow = 1;
  headers.forEach((h, i) => { sheet.getCell(hRow, i + 1).value = h; });
  styleHeaderRow(sheet, hRow, headers.length);

  report.fno_opportunities.forEach((f, i) => {
    const row = sheet.getRow(hRow + 1 + i);
    const vals = [f.symbol, f.trend, f.oi_change, f.strategy, f.entry, f.target_1, f.target_2, f.stop_loss, f.risk_reward, f.success_probability];
    vals.forEach((v, j) => { row.getCell(j + 1).value = v; });
    zebraRow(row, i % 2 === 0, headers.length);
    const isBull = f.trend.toLowerCase().includes('bull');
    setCell(row.getCell(2), f.trend, {
      color: isBull ? C.green : C.red,
      bg: isBull ? C.greenLight : C.redLight,
      bold: true,
    });
    row.getCell(10).fill = solidFill(scoreFill(f.success_probability, 100));
  });

  [10, 22, 28, 24, 10, 10, 10, 10, 8, 10].forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function buildNiftySheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('Nifty Strategies');
  const headers = ['Strategy', 'Market Condition', 'Entry Condition', 'Max Profit', 'Max Loss', 'Probability', 'R:R', 'Confidence'];
  const hRow = 1;
  headers.forEach((h, i) => { sheet.getCell(hRow, i + 1).value = h; });
  styleHeaderRow(sheet, hRow, headers.length);

  report.nifty_strategies.forEach((n, i) => {
    const row = sheet.getRow(hRow + 1 + i);
    const vals = [n.name, n.market_condition, n.entry_condition, n.max_profit, n.max_loss, n.probability, n.risk_reward, n.confidence];
    vals.forEach((v, j) => { row.getCell(j + 1).value = v; });
    zebraRow(row, i % 2 === 0, headers.length);
    row.getCell(8).fill = solidFill(scoreFill(n.confidence, 10));
    if (i === 0) {
      for (let c = 1; c <= 8; c++) {
        row.getCell(c).fill = solidFill(C.emeraldLight);
        row.getCell(c).font = { name: FONT, size: 10, bold: true };
      }
    }
  });

  [22, 28, 32, 18, 18, 12, 8, 12].forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

function buildSectorSheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('Sector Leadership');
  sectionTitle(sheet, 1, 'Sector Leadership Rankings', 6);
  sheet.mergeCells(2, 1, 2, 6);
  setCell(sheet.getCell(2, 1), `Best 1M: ${report.best_sector_1m}  |  1Y: ${report.best_sector_1y}  |  5Y: ${report.best_sector_5y}`, {
    bold: true, bg: C.emeraldPale, color: C.emeraldDark, align: 'center',
  });

  const headers = ['Rank', 'Sector', 'Financial Strength', 'Technical Strength', 'Institutional Interest', 'Growth Outlook'];
  const hRow = 4;
  headers.forEach((h, i) => { sheet.getCell(hRow, i + 1).value = h; });
  styleHeaderRow(sheet, hRow, headers.length);

  report.sector_leadership.forEach((s, i) => {
    const row = sheet.getRow(hRow + 1 + i);
    const vals = [s.rank, s.sector, s.financial_strength, s.technical_strength, s.institutional_interest, s.growth_outlook];
    vals.forEach((v, j) => { row.getCell(j + 1).value = v; });
    zebraRow(row, i % 2 === 0, headers.length);
    if (s.rank <= 3) {
      const medal = s.rank === 1 ? C.emeraldLight : s.rank === 2 ? C.amberLight : C.blueLight;
      row.getCell(1).fill = solidFill(medal);
      row.getCell(2).font = { name: FONT, size: 10, bold: true };
    }
    const growth = s.growth_outlook.toLowerCase();
    const growthBg = growth.includes('positive') ? C.greenLight : growth.includes('weak') ? C.redLight : C.amberLight;
    row.getCell(6).fill = solidFill(growthBg);
  });

  [6, 20, 32, 32, 28, 18].forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
  sheet.views = [{ state: 'frozen', ySplit: 4 }];
}

function buildIpoSheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('IPO Research');
  const headers = ['IPO Name', 'Symbol', 'Status', 'Fin. Strength', 'Business Quality', 'Valuation', 'Recommendation', 'Opportunity Type', 'Summary'];
  const hRow = 1;
  headers.forEach((h, i) => { sheet.getCell(hRow, i + 1).value = h; });
  styleHeaderRow(sheet, hRow, headers.length);

  report.ipo_research.forEach((ipo, i) => {
    const row = sheet.getRow(hRow + 1 + i);
    const vals = [ipo.name, ipo.symbol, ipo.status, ipo.financial_strength, ipo.business_quality, ipo.valuation_score, ipo.recommendation, ipo.opportunity_type, ipo.summary];
    vals.forEach((v, j) => { row.getCell(j + 1).value = v; });
    zebraRow(row, i % 2 === 0, headers.length);
    setCell(row.getCell(7), ipo.recommendation, {
      bold: true,
      color: recFont(ipo.recommendation),
      bg: recFill(ipo.recommendation),
      align: 'center',
    });
    row.getCell(4).fill = solidFill(scoreFill(ipo.financial_strength, 10));
    row.getCell(5).fill = solidFill(scoreFill(ipo.business_quality, 10));
    row.getCell(6).fill = solidFill(scoreFill(ipo.valuation_score, 10));
  });

  [24, 12, 12, 12, 14, 10, 16, 22, 40].forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  if (report.ipo_research.length) {
    sheet.autoFilter = { from: 'A1', to: `I${report.ipo_research.length + 1}` };
  }
}

function buildDashboardSheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('Action Dashboard');
  const dash = report.actionable_dashboard;
  const categories: [string, string[], string][] = [
    ['Long-Term Buys', dash.long_term_buys, C.greenLight],
    ['Swing Trades', dash.swing_trades, C.blueLight],
    ['Positional Trades', dash.positional_trades, C.emeraldPale],
    ['F&O Trades', dash.fno_trades, C.purpleLight],
    ['Option Buying', dash.option_buying, C.amberLight],
    ['Option Selling', dash.option_selling, C.zinc100],
    ['High Risk / High Reward', dash.high_risk_high_reward, C.redLight],
    ['Low Risk', dash.low_risk, C.greenLight],
  ];

  let row = 1;
  sectionTitle(sheet, row, 'Actionable Trading Dashboard', 3);
  row += 2;

  categories.forEach(([label, picks, bg]) => {
    setCell(sheet.getCell(row, 1), label, { bold: true, size: 11, color: C.white, bg: C.emeraldDark });
    sheet.mergeCells(row, 2, row, 3);
    setCell(sheet.getCell(row, 2), picks.length ? picks.join(', ') : '—', { wrap: true, bg });
    sheet.getRow(row).height = picks.length > 5 ? 40 : 24;
    row++;
  });

  sheet.getColumn(1).width = 24;
  sheet.getColumn(2).width = 60;
  sheet.getColumn(3).width = 10;
}

function buildBestIdeasSheet(wb: ExcelJS.Workbook, report: DailyReport) {
  const sheet = wb.addWorksheet('Best Ideas');
  const headers = ['Category', 'Title', 'Rationale', 'Entry / Buy Zone', 'Target', 'Stop Loss', 'Conviction / Prob'];
  const hRow = 1;
  headers.forEach((h, i) => { sheet.getCell(hRow, i + 1).value = h; });
  styleHeaderRow(sheet, hRow, headers.length);

  const ideas: [string, BestIdea][] = [
    ['Best Equity', report.best_ideas.best_equity],
    ['Best Swing', report.best_ideas.best_swing],
    ['Best F&O', report.best_ideas.best_fno],
    ['Best Nifty', report.best_ideas.best_nifty],
  ];

  ideas.forEach(([cat, idea], i) => {
    const row = sheet.getRow(hRow + 1 + i);
    const vals = [cat, idea.title, idea.why, idea.entry_or_buy_zone, idea.target, idea.stop_loss, idea.conviction_or_probability];
    vals.forEach((v, j) => { row.getCell(j + 1).value = v; });
    zebraRow(row, i % 2 === 0, headers.length);
    for (let c = 1; c <= 7; c++) {
      row.getCell(c).fill = solidFill(i === 0 ? C.emeraldLight : i % 2 === 0 ? C.emeraldPale : C.white);
    }
    row.getCell(1).font = { name: FONT, size: 10, bold: true, color: { argb: C.emeraldDark } };
    sheet.getRow(hRow + 1 + i).height = 36;
  });

  [14, 28, 40, 18, 14, 14, 16].forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
}

export async function downloadDailyReportExcel(report: DailyReport) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'N314 Quant Engine';
  wb.created = new Date();
  wb.modified = new Date();

  buildSummarySheet(wb, report);
  buildMarketSheet(wb, report);
  buildFiiDiiSheet(wb, report);
  buildTop200Sheet(wb, report);
  buildTop25Sheet(wb, report);
  buildFnoSheet(wb, report);
  buildNiftySheet(wb, report);
  buildSectorSheet(wb, report);
  buildIpoSheet(wb, report);
  buildDashboardSheet(wb, report);
  buildBestIdeasSheet(wb, report);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeDate = report.report_date.replace(/[/\\]/g, '-');
  anchor.href = url;
  anchor.download = `N314-Daily-Report-${safeDate}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
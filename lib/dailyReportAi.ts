import { callGeminiReport } from './gemini';
import type { DailyReportData, ScoredStock } from './dailyReportData';

const ROLE =
  'Institutional India market research desk. Use ONLY provided data. Cite numbers. Minified JSON only. No markdown.';

function corePayload(data: DailyReportData) {
  const { indices, flows } = data;
  return `date:${data.report_date}|NIFTY:${indices.nifty}|BN:${indices.bank_nifty}|SX:${indices.sensex}|VIX:${indices.vix}|FII:${flows.fii_net_cr}|DII:${flows.dii_net_cr}|trend:${indices.nifty_trend.direction}`;
}

function miniStocks(stocks: ScoredStock[], limit = 12) {
  return stocks
    .slice(0, limit)
    .map((s) => `${s.symbol}:${s.cmp}:RSI${s.rsi ?? '-'}:mom${s.momentum_20d}:c${s.conviction_score}`)
    .join(',');
}

function stockLines(data: DailyReportData, symbols: string[]) {
  const set = new Set(symbols);
  return data.top25Scored
    .filter((s) => set.has(s.symbol))
    .map((s) => `${s.symbol}|${s.cmp}|RSI${s.rsi ?? '-'}|mom${s.momentum_20d}|conv${s.conviction_score}|risk${s.risk_score}|PE${s.pe ?? '-'}`)
    .join('\n');
}

/** Gemini — executive summary + market + FII */
export async function generateReportSummary(data: DailyReportData) {
  return callGeminiReport(
    `${ROLE} Output JSON keys: confidence_score, executive_summary, market_overview, fii_dii_analysis.`,
    `${corePayload(data)}\nTOP12:${miniStocks(data.top25Scored, 12)}`
  );
}

/** Gemini — top 25 deep dives, one batch */
export async function generateReportTop25Batch(data: DailyReportData, symbols: string[]) {
  return callGeminiReport(
    `${ROLE} Output JSON: {"top_25":[...]}. One entry per symbol: ${symbols.join(',')}. Fields: symbol, stock, sector, recommendation, conviction_score, business_overview, financial_highlights[], technical_view, valuation_view, risks[], bull_case, base_case, bear_case, investment_plan, why_buy, key_risk.`,
    `${corePayload(data)}\nSTOCKS:\n${stockLines(data, symbols)}`,
    { maxOutputTokens: 8192 }
  );
}

/** Gemini — F&O + Nifty strategies */
export async function generateReportFno(data: DailyReportData) {
  return callGeminiReport(
    `${ROLE} Output JSON: fno_opportunities[], nifty_strategies[]. Max 10 F&O, 6 Nifty. Each trade: entry, targets, stop_loss, risk_reward, success_probability.`,
    `${corePayload(data)}\nLIQUID:${miniStocks(data.top25Scored, 15)}`
  );
}

/** Gemini — sectors, IPO, dashboard, best ideas */
export async function generateReportSectors(data: DailyReportData) {
  const topSectors = Object.entries(data.sectorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');

  return callGeminiReport(
    `${ROLE} Output JSON: sector_leadership[], best_sector_1m/1y/5y, ipo_research[], actionable_dashboard, best_ideas, risk_disclaimer.`,
    `${corePayload(data)}\nSECTORS:${topSectors}\nIPO:${data.ipoPayload}\nTOP20:${data.compactTop200.slice(0, 800)}`,
    { maxOutputTokens: 8192 }
  );
}

export async function generateAllReportParts(data: DailyReportData) {
  const top25Symbols = data.top25Scored
    .sort((a, b) => b.conviction_score - a.conviction_score)
    .slice(0, 25)
    .map((s) => s.symbol);

  // 3 batches of ~8 stocks — keeps each Gemini response within safe output limits
  const batches = [
    top25Symbols.slice(0, 9),
    top25Symbols.slice(9, 17),
    top25Symbols.slice(17, 25),
  ].filter((b) => b.length > 0);

  // Wave 1: summary + F&O + sectors (small/medium payloads)
  const [summaryRaw, fnoRaw, sectorsRaw] = await Promise.all([
    generateReportSummary(data),
    generateReportFno(data),
    generateReportSectors(data),
  ]);

  // Wave 2: top-25 deep dives (heavy) — avoids bursting rate limits
  const top25Raws = await Promise.all(
    batches.map((batch) => generateReportTop25Batch(data, batch))
  );

  return { summaryRaw, top25Raws, fnoRaw, sectorsRaw };
}
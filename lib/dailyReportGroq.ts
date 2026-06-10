import { callGroqDailyReport } from './groq';
import type { DailyReportData } from './dailyReportData';

const ROLE =
  'You are an institutional research desk (CIO, equity, fundamental, technical, F&O, portfolio, risk, IPO, macro). Use ONLY provided market data. Cite numbers. No generic fluff. JSON only.';

const PART_A_SCHEMA = `JSON:{"confidence_score":number,"executive_summary":{"market_sentiment":"str","nifty_outlook":"str","bank_nifty_outlook":"str","top_opportunities":["str"],"major_risks":["str"],"events_to_watch":["str"],"best_stock":"str","best_fno_trade":"str","best_nifty_strategy":"str","best_sector":"str","summary":"str"},"market_overview":{"advance_decline":"str","breadth_analysis":"str","institutional_positioning":"str","sector_rotation":"str","global_impact":"str","next_day":{"bullish_pct":number,"neutral_pct":number,"bearish_pct":number},"weekly_outlook":{"range":"str","targets":"str","risks":"str"}},"fii_dii_analysis":{"cash_activity":"str","futures_activity":"str","options_activity":"str","smart_money":"str","accumulation_signals":["str"],"distribution_signals":["str"],"next_session_impact":"str"},"top_25":[{"symbol":"str","stock":"str","sector":"str","recommendation":"Strong Buy|Buy|Hold|Avoid","conviction_score":number,"business_overview":"str","financial_highlights":["str"],"technical_view":"str","valuation_view":"str","risks":["str"],"bull_case":{"probability":"str","target":"str"},"base_case":{"probability":"str","target":"str"},"bear_case":{"probability":"str","target":"str"},"investment_plan":{"buy_zone":"str","stop_loss":"str","target_1y":"str","target_3y":"str","expected_cagr":"str"},"why_buy":"str","key_risk":"str"}]}`;

const PART_B_SCHEMA = `JSON:{"fno_opportunities":[{"symbol":"str","trend":"str","oi_change":"str","strategy":"str","entry":"str","target_1":"str","target_2":"str","stop_loss":"str","risk_reward":"str","success_probability":number}],"nifty_strategies":[{"name":"str","market_condition":"str","entry_condition":"str","max_profit":"str","max_loss":"str","probability":"str","risk_reward":"str","confidence":number}],"sector_leadership":[{"sector":"str","rank":number,"financial_strength":"str","technical_strength":"str","institutional_interest":"str","growth_outlook":"str"}],"best_sector_1m":"str","best_sector_1y":"str","best_sector_5y":"str","ipo_research":[{"name":"str","symbol":"str","status":"str","financial_strength":number,"business_quality":number,"valuation_score":number,"recommendation":"Strong Apply|Apply|Neutral|Avoid","opportunity_type":"str","summary":"str"}],"actionable_dashboard":{"long_term_buys":["sym"],"swing_trades":["sym"],"positional_trades":["sym"],"fno_trades":["sym"],"option_buying":["sym"],"option_selling":["sym"],"high_risk_high_reward":["sym"],"low_risk":["sym"]},"best_ideas":{"best_equity":{"title":"str","why":"str","entry_or_buy_zone":"str","target":"str","stop_loss":"str","conviction_or_probability":"str"},"best_swing":{"title":"str","why":"str","entry_or_buy_zone":"str","target":"str","stop_loss":"str","conviction_or_probability":"str"},"best_fno":{"title":"str","why":"str","entry_or_buy_zone":"str","target":"str","stop_loss":"str","conviction_or_probability":"str"},"best_nifty":{"title":"str","why":"str","entry_or_buy_zone":"str","target":"str","stop_loss":"str","conviction_or_probability":"str"}},"risk_disclaimer":"str"}`;

function buildPayload(data: DailyReportData) {
  const { indices, flows } = data;
  return [
    `date:${data.report_date}`,
    `universe:${data.universe_size}`,
    `NIFTY:${indices.nifty}|BANKNIFTY:${indices.bank_nifty}|SENSEX:${indices.sensex}|VIX:${indices.vix}`,
    `NIFTY_TREND:slope${indices.nifty_trend.trend_slope}|dir:${indices.nifty_trend.direction}|pred1d:${indices.nifty_trend.predicted_next_day}`,
    `FII_NET:${flows.fii_net_cr}|DII_NET:${flows.dii_net_cr}|FII_BUY:${flows.fii_buy_cr}|DII_BUY:${flows.dii_buy_cr}`,
    `TOP200_SAMPLE:\n${data.compactTop200}`,
    `SCORED_STOCKS:\n${data.compactScored}`,
    `IPO:\n${data.ipoPayload}`,
    `SECTORS:${JSON.stringify(data.sectorCounts)}`,
  ].join('\n');
}

export async function groqDailyReportPartA(data: DailyReportData) {
  const top25List = data.top25Scored.map((s) => s.symbol).join(',');
  return callGroqDailyReport(
    `${ROLE} Generate Part A of Daily Institutional Report. Deep-analyze ONLY these 25 symbols: ${top25List}. ${PART_A_SCHEMA}. Max 25 top_25 entries matching symbols. Each must cite real CMP/RSI/momentum from SCORED_STOCKS.`,
    buildPayload(data)
  );
}

export async function groqDailyReportPartB(data: DailyReportData) {
  return callGroqDailyReport(
    `${ROLE} Generate Part B of Daily Institutional Report. ${PART_B_SCHEMA}. Max 15 fno_opportunities, 10 nifty_strategies, 12 sector_leadership, 6 ipo_research. Use SCORED_STOCKS and IPO data. Every trade needs entry/target/stop/R:R.`,
    buildPayload(data)
  );
}
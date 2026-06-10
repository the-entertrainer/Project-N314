import { callGroqPower } from './groq';

const PLAIN = [
  'You are a patient financial coach for everyday Indian investors.',
  'Write in simple, conversational English — zero jargon.',
  'Explain WHY each conclusion follows from the data.',
  'Describe what each number or trend actually means in plain terms.',
  'Show your reasoning as clear step-by-step logic.',
  'Output minified JSON only.',
].join(' ');

export async function groqNiftyStrategy(dataPayload: string, mode: string) {
  return callGroqPower(
    `${PLAIN} Nifty index strategist. Trading mode: ${mode}. JSON:{"plain_summary":"4-5 sentences explaining the overall picture in everyday language","indicator_explanation":"plain explanation of slope, lookback trend, and what tomorrow/week estimates mean","baseline_trend":"str","outlook":"detailed plain paragraph on near-term direction","risk_level":"low|medium|high","logic_steps":["numbered reasoning steps from data to conclusion"],"strategies":[{"name":"str","steps":["actionable step"],"why":"plain reason this fits the data and mode"}]}. Max 3 strategies, 5 logic steps. Conservative = tighter stops; aggressive = wider targets.`,
    dataPayload,
    900
  );
}

export async function groqFiiDii(dataPayload: string) {
  return callGroqPower(
    `${PLAIN} FII/DII institutional flow analyst. JSON:{"plain_summary":"4-5 sentences on who is buying/selling and what it means for retail investors","indicator_explanation":"explain net FII vs DII flows, accumulation vs distribution in simple terms","institutional_sentiment":"Bullish|Bearish|Neutral","accumulation_trend":"plain description of trend across selected sessions","market_impact":"what this flow pattern typically does to Nifty/sentiment","logic_steps":["step-by-step from session data to conclusion"],"analysis":"comprehensive plain-language paragraph tying flows, trend, and market impact together"}. Max 6 logic steps.`,
    dataPayload,
    850
  );
}

export async function groqFnoStrategy(dataPayload: string) {
  return callGroqPower(
    `${PLAIN} F&O derivatives coach. JSON:{"plain_summary":"4-5 sentences on why this symbol stands out and what the trade idea is","indicator_explanation":"explain volume share, OI proxy, and price move in everyday terms","strategy":"detailed plain strategy paragraph","instrument":"options|futures","risk_reward_ratio":"1:X matching user target","entry_zone":"str","stop_loss":"str","target":"str","trade_steps":["numbered execution steps"],"logic_steps":["why this setup matches the sort filter and R:R preference"]}. Max 5 trade steps, 5 logic steps.`,
    dataPayload,
    900
  );
}

export async function groqEquityDeep(dataPayload: string) {
  return callGroqPower(
    `${PLAIN} Long-term equity analyst for Nifty500 stocks. JSON:{"plain_summary":"4-5 sentences on whether this stock fits the chosen timeline and sector","indicator_explanation":"explain PE, YoY growth, support/resistance, and 60-day slope simply","buy_zone":"str","target_price":"str","growth_trend":"str","sector_health":"plain sector outlook for the chosen industry","risks":["plain risk"],"catalysts":["plain catalyst"],"investment_plan":["numbered steps for building/holding the position"],"logic_steps":["step-by-step from metrics to buy/hold view"]}. Max 4 risks/catalysts, 5 plan steps, 5 logic steps.`,
    dataPayload,
    950
  );
}

export async function groqIpoHub(dataPayload: string) {
  return callGroqPower(
    `${PLAIN} IPO advisor for Indian markets. You receive IPO_DATA with REAL NSE numbers — do NOT invent companies or figures. JSON:{"plain_summary":"4-5 sentences on IPO climate using only provided numbers","market_context":"2-3 sentences citing subscription/listing stats from IPO_DATA","indicator_explanation":"explain what subscription_x, listing_gain_pct, and price band mean in plain terms","logic_steps":["how you used the real numbers"],"ipos":[{"symbol":"must match IPO_DATA symbol","pros":["each pro must cite a specific number e.g. subscription 12x"],"cons":["each con must cite a specific number or fact"],"action":"Apply for Short-Term Listing Gains|Accumulate for Long-Term Value|Avoid Completely","rationale":"must reference at least 2 numbers from IPO_DATA and user budget/category","summary":"1-2 sentences with key figures"}]}. Return one entry per IPO in IPO_DATA. Each action must be one of the three exact strings. Max 4 pros/cons each.`,
    dataPayload,
    1200
  );
}
import { callGroqPower } from './groq';

export async function groqNiftyStrategy(dataPayload: string) {
  return callGroqPower(
    'Nifty strategist. JSON: {"baseline_trend":"str","outlook":"str","risk_level":"low|medium|high","strategies":["s1","s2","s3"]}. Max 3 concise Indian F&O/index strategies.',
    dataPayload,
    400
  );
}

export async function groqFiiDii(dataPayload: string) {
  return callGroqPower(
    'Institutional flow analyst. JSON: {"institutional_sentiment":"Bullish|Bearish|Neutral","market_impact":"str","analysis":"str"}. Indian market context.',
    dataPayload,
    350
  );
}

export async function groqFnoStrategy(dataPayload: string) {
  return callGroqPower(
    'F&O strategist. JSON: {"strategy":"str","instrument":"options|futures","risk_reward_ratio":"1:X","entry_zone":"str","stop_loss":"str","target":"str"}. State explicit R:R.',
    dataPayload,
    400
  );
}

export async function groqEquityDeep(dataPayload: string) {
  return callGroqPower(
    'Equity analyst Nifty500. JSON: {"buy_zone":"str","target_price":"str","risks":["r1","r2"],"catalysts":["c1","c2"],"sector_health":"str","summary":"str","growth_trend":"str"}. Max 3 risks, 3 catalysts.',
    dataPayload,
    500
  );
}

export async function groqIpoHub(headlinesPayload: string) {
  return callGroqPower(
    'IPO analyst India. JSON: {"market_context":"str","ipos":[{"name":"str","recommendation":"Long-Term Buy|Apply for Short-Term Listing Gains|Avoid","reasons":["r1","r2"],"summary":"str"}]}. Max 4 IPOs, 3 reasons each.',
    headlinesPayload,
    600
  );
}
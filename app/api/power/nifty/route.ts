import { NextResponse } from 'next/server';
import { fetchNiftyTrend } from '../../../../lib/powerData';
import { groqNiftyStrategy } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';

export async function GET() {
  try {
    const trend = await fetchNiftyTrend();
    const payload = `price:${trend.current_price}|pred1d:${trend.predicted_next_day}|pred1w:${trend.predicted_week}|slope:${trend.trend_slope}|dir:${trend.direction}|pct1d:${trend.pct_day}|pct1w:${trend.pct_week}|recent:${trend.recent_closes}`;
    const raw = await groqNiftyStrategy(payload);
    const ai = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      data: {
        current_price: trend.current_price,
        trend_slope: trend.trend_slope,
        predicted_next_day: trend.predicted_next_day,
        predicted_week: trend.predicted_week,
        baseline_trend: ai.baseline_trend || `${trend.direction} (${trend.pct_day}% 1d)`,
        strategies: Array.isArray(ai.strategies) ? ai.strategies.slice(0, 3) : [],
        outlook: ai.outlook || '',
        risk_level: ai.risk_level || 'medium',
      },
    });
  } catch (e) {
    if (e instanceof GroqRateLimitError) {
      return NextResponse.json({ success: false, error: 'Groq rate limit. Try again shortly.', code: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Nifty strategy failed' }, { status: 500 });
  }
}
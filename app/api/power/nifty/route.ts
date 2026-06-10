import { NextRequest, NextResponse } from 'next/server';
import { fetchNiftyTrend } from '../../../../lib/powerData';
import { groqNiftyStrategy } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';
import { parseAiBreakdown, parseStrategies } from '../../../../lib/powerValidate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const lookback = [10, 20, 30].includes(body.lookback) ? body.lookback : 20;
    const mode = body.mode === 'aggressive' ? 'aggressive' : 'conservative';

    const trend = await fetchNiftyTrend(lookback);
    const payload = `lookback:${lookback}|mode:${mode}|price:${trend.current_price}|pred1d:${trend.predicted_next_day}|pred1w:${trend.predicted_week}|slope:${trend.trend_slope}|dir:${trend.direction}|pct1d:${trend.pct_day}|pct1w:${trend.pct_week}|recent:${trend.recent_closes}`;
    const raw = await groqNiftyStrategy(payload, mode);
    const ai = JSON.parse(raw) as Record<string, unknown>;
    const breakdown = parseAiBreakdown(ai);

    return NextResponse.json({
      success: true,
      data: {
        ...breakdown,
        current_price: trend.current_price,
        trend_slope: trend.trend_slope,
        predicted_next_day: trend.predicted_next_day,
        predicted_week: trend.predicted_week,
        lookback_days: lookback,
        baseline_trend: ai.baseline_trend || `${trend.direction} trend over ${lookback} days`,
        strategies: parseStrategies(ai.strategies),
        outlook: String(ai.outlook || '').slice(0, 400),
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

export async function GET() {
  return POST(new NextRequest('http://local', { method: 'POST', body: '{}' }));
}
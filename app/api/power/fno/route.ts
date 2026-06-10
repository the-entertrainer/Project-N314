import { NextResponse } from 'next/server';
import { fetchFnoLeader } from '../../../../lib/powerData';
import { groqFnoStrategy } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';

export async function GET() {
  try {
    const fno = await fetchFnoLeader();
    const payload = `symbol:${fno.top_symbol}|vol_share:${fno.volume_share_pct}%|price:${fno.current_price}|trend:${fno.trend}|trend_pct:${fno.trend_pct}`;
    const raw = await groqFnoStrategy(payload);
    const ai = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      data: {
        top_symbol: fno.top_symbol,
        volume_share_pct: fno.volume_share_pct,
        current_price: fno.current_price,
        trend: fno.trend,
        strategy: ai.strategy || '',
        instrument: ai.instrument || 'options',
        risk_reward_ratio: ai.risk_reward_ratio || '1:2',
        entry_zone: ai.entry_zone || '',
        stop_loss: ai.stop_loss || '',
        target: ai.target || '',
      },
    });
  } catch (e) {
    if (e instanceof GroqRateLimitError) {
      return NextResponse.json({ success: false, error: 'Groq rate limit. Try again shortly.', code: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'F&O analysis failed' }, { status: 500 });
  }
}
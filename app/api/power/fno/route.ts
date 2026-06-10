import { NextRequest, NextResponse } from 'next/server';
import { fetchFnoLeader } from '../../../../lib/powerData';
import { groqFnoStrategy } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';
import { parseAiBreakdown, parseStringArray } from '../../../../lib/powerValidate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sort = ['volume', 'oi_change', 'price_delta'].includes(body.sort) ? body.sort : 'volume';
    const targetRr = Math.min(5, Math.max(1, Number(body.targetRr) || 2));

    const fno = await fetchFnoLeader(sort);
    const payload = `sort:${sort}|target_rr:1:${targetRr}|symbol:${fno.top_symbol}|vol_share:${fno.volume_share_pct}%|oi_proxy:${fno.oi_change_proxy}|price_delta:${fno.price_delta}|price:${fno.current_price}|trend:${fno.trend}`;
    const raw = await groqFnoStrategy(payload);
    const ai = JSON.parse(raw) as Record<string, unknown>;
    const breakdown = parseAiBreakdown(ai);

    return NextResponse.json({
      success: true,
      data: {
        ...breakdown,
        top_symbol: fno.top_symbol,
        volume_share_pct: fno.volume_share_pct,
        current_price: fno.current_price,
        trend: fno.trend,
        sort_mode: sort,
        strategy: String(ai.strategy || '').slice(0, 400),
        instrument: ai.instrument || 'options',
        risk_reward_ratio: ai.risk_reward_ratio || `1:${targetRr}`,
        entry_zone: String(ai.entry_zone || '').slice(0, 120),
        stop_loss: String(ai.stop_loss || '').slice(0, 120),
        target: String(ai.target || '').slice(0, 120),
        trade_steps: parseStringArray(ai.trade_steps, 5),
      },
    });
  } catch (e) {
    if (e instanceof GroqRateLimitError) {
      return NextResponse.json({ success: false, error: 'Groq rate limit. Try again shortly.', code: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'F&O analysis failed' }, { status: 500 });
  }
}

export async function GET() {
  return POST(new NextRequest('http://local', { method: 'POST', body: '{}' }));
}
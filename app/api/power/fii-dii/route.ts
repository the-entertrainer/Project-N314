import { NextRequest, NextResponse } from 'next/server';
import { fetchFiiDiiFlows, fetchFiiDiiHistory } from '../../../../lib/powerData';
import { groqFiiDii } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';
import { fetchFromSources, formatHeadlinesForGroq } from '../../../../lib/tickerNews';
import { parseAiBreakdown } from '../../../../lib/powerValidate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sessions = [1, 5, 10].includes(body.sessions) ? body.sessions : 5;

    const flows = await fetchFiiDiiFlows();
    const history = await fetchFiiDiiHistory(sessions);
    const histPayload = history.map((h) => `${h.date}:FII${h.fii_net_cr}:DII${h.dii_net_cr}`).join('|');

    let payload = `sessions:${sessions}|${histPayload}|latest_fii_net:${flows.fii_net_cr}|latest_dii_net:${flows.dii_net_cr}`;

    if ('fallback' in flows && flows.fallback) {
      const macro = await fetchFromSources('India FII DII flows institutional', 5, process.env.GNEWS_API_KEY);
      payload += `\nNEWS:\n${formatHeadlinesForGroq(macro)}`;
    }

    const raw = await groqFiiDii(payload);
    const ai = JSON.parse(raw) as Record<string, unknown>;
    const breakdown = parseAiBreakdown(ai);

    return NextResponse.json({
      success: true,
      data: {
        ...breakdown,
        ...flows,
        sessions: history,
        institutional_sentiment: ai.institutional_sentiment || 'Neutral',
        market_impact: String(ai.market_impact || '').slice(0, 400),
        accumulation_trend: String(ai.accumulation_trend || ai.analysis || '').slice(0, 400),
        analysis: String(ai.analysis || '').slice(0, 600),
      },
    });
  } catch (e) {
    if (e instanceof GroqRateLimitError) {
      return NextResponse.json({ success: false, error: 'Groq rate limit. Try again shortly.', code: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'FII/DII analysis failed' }, { status: 500 });
  }
}

export async function GET() {
  return POST(new NextRequest('http://local', { method: 'POST', body: '{}' }));
}
import { NextResponse } from 'next/server';
import { fetchIpoHeadlines } from '../../../../lib/powerData';
import { groqIpoHub } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';

export async function GET() {
  try {
    const headlines = await fetchIpoHeadlines();
    const payload =
      headlines.length > 0
        ? headlines.map((h) => `${h.date}|${h.title}`).join('\n')
        : `${new Date().toISOString().slice(0, 10)}|India IPO market active with upcoming listings`;

    const raw = await groqIpoHub(payload);
    const ai = JSON.parse(raw);

    const ipos = Array.isArray(ai.ipos)
      ? ai.ipos.slice(0, 4).map((item: Record<string, unknown>) => {
          const rec = item.recommendation as string;
          const valid =
            rec === 'Long-Term Buy' ||
            rec === 'Apply for Short-Term Listing Gains' ||
            rec === 'Avoid'
              ? rec
              : 'Avoid';
          return {
            name: String(item.name || '').slice(0, 80),
            recommendation: valid,
            reasons: Array.isArray(item.reasons) ? item.reasons.map((r) => String(r).slice(0, 120)).slice(0, 3) : [],
            summary: String(item.summary || '').slice(0, 200),
          };
        })
      : [];

    return NextResponse.json({
      success: true,
      data: {
        ipos,
        market_context: ai.market_context || '',
      },
    });
  } catch (e) {
    if (e instanceof GroqRateLimitError) {
      return NextResponse.json({ success: false, error: 'Groq rate limit. Try again shortly.', code: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'IPO analysis failed' }, { status: 500 });
  }
}
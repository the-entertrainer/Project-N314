import { NextRequest, NextResponse } from 'next/server';
import { fetchIpoHeadlines } from '../../../../lib/powerData';
import { groqIpoHub } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';
import { parseAiBreakdown, parseIpoAction, parseStringArray } from '../../../../lib/powerValidate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const filter = body.filter === 'recent' ? 'recent' : 'upcoming';
    const category = body.category === 'hni' ? 'hni' : 'retail';
    const budget = String(body.budget || '200000');

    const headlines = await fetchIpoHeadlines(filter);
    const payload =
      (headlines.length > 0
        ? headlines.map((h) => `${h.date}|${h.title}`).join('\n')
        : `${new Date().toISOString().slice(0, 10)}|India IPO market`) +
      `\nfilter:${filter}|category:${category}|budget:₹${budget}`;

    const raw = await groqIpoHub(payload);
    const ai = JSON.parse(raw) as Record<string, unknown>;
    const breakdown = parseAiBreakdown(ai);

    const ipos = Array.isArray(ai.ipos)
      ? ai.ipos.slice(0, 6).map((item: Record<string, unknown>) => ({
          name: String(item.name || '').slice(0, 80),
          status: item.status === 'recent' ? 'recent' : 'upcoming',
          pros: parseStringArray(item.pros, 4),
          cons: parseStringArray(item.cons, 4),
          action: parseIpoAction(String(item.action || '')),
          rationale: String(item.rationale || '').slice(0, 300),
          summary: String(item.summary || '').slice(0, 250),
        }))
      : [];

    return NextResponse.json({
      success: true,
      data: {
        ...breakdown,
        ipos,
        market_context: String(ai.market_context || '').slice(0, 400),
        filter,
        category,
        budget,
      },
    });
  } catch (e) {
    if (e instanceof GroqRateLimitError) {
      return NextResponse.json({ success: false, error: 'Groq rate limit. Try again shortly.', code: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'IPO analysis failed' }, { status: 500 });
  }
}

export async function GET() {
  return POST(new NextRequest('http://local', { method: 'POST', body: '{}' }));
}
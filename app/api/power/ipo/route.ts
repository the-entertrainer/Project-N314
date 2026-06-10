import { NextRequest, NextResponse } from 'next/server';
import { fetchIpoFactRecords, buildIpoGroqPayload } from '../../../../lib/ipoFacts';
import { mergeIpoAnalysis } from '../../../../lib/ipoAnalysis';
import { groqIpoHub } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';
import { parseAiBreakdown } from '../../../../lib/powerValidate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const filter = body.filter === 'recent' ? 'recent' : 'upcoming';
    const category = body.category === 'hni' ? 'hni' : 'retail';
    const budget = String(body.budget || '200000');

    const records = await fetchIpoFactRecords(filter);

    if (records.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No IPO records available from NSE right now. Try again shortly.',
      }, { status: 503 });
    }

    const payload = buildIpoGroqPayload(records, filter, category, budget);

    let breakdown = {
      plain_summary: '',
      logic_steps: [] as string[],
      indicator_explanation: '',
    };
    let aiIpos: Record<string, unknown>[] | undefined;

    try {
      const raw = await groqIpoHub(payload);
      const ai = JSON.parse(raw) as Record<string, unknown>;
      breakdown = parseAiBreakdown(ai);
      aiIpos = Array.isArray(ai.ipos)
        ? (ai.ipos as Record<string, unknown>[])
        : undefined;
    } catch {
      /* Groq unavailable — factual data + rule-based analysis still returned */
    }

    const ipos = mergeIpoAnalysis(records, aiIpos);

    const marketContext =
      breakdown.plain_summary ||
      `Showing ${ipos.length} ${filter === 'recent' ? 'recently listed' : 'open/upcoming'} IPOs with verified NSE figures.`;

    return NextResponse.json({
      success: true,
      data: {
        ...breakdown,
        ipos,
        market_context: marketContext.slice(0, 500),
        filter,
        category,
        budget,
        data_sources: ['NSE India', 'Yahoo Finance', 'GNews', 'Google News'],
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
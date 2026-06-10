import { NextResponse } from 'next/server';
import { fetchFiiDiiFlows } from '../../../../lib/powerData';
import { groqFiiDii } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';
import { fetchFromSources, formatHeadlinesForGroq } from '../../../../lib/tickerNews';

export async function GET() {
  try {
    const flows = await fetchFiiDiiFlows();
    let payload = `date:${flows.date}|fii_net:${flows.fii_net_cr}|dii_net:${flows.dii_net_cr}|fii_buy:${flows.fii_buy_cr}|fii_sell:${flows.fii_sell_cr}|dii_buy:${flows.dii_buy_cr}|dii_sell:${flows.dii_sell_cr}`;

    if ('fallback' in flows && flows.fallback) {
      const macro = await fetchFromSources('India FII DII flows institutional', 5, process.env.GNEWS_API_KEY);
      payload += `\nNEWS:\n${formatHeadlinesForGroq(macro)}`;
    }

    const raw = await groqFiiDii(payload);
    const ai = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      data: {
        ...flows,
        institutional_sentiment: ai.institutional_sentiment || 'Neutral',
        market_impact: ai.market_impact || '',
        analysis: ai.analysis || '',
      },
    });
  } catch (e) {
    if (e instanceof GroqRateLimitError) {
      return NextResponse.json({ success: false, error: 'Groq rate limit. Try again shortly.', code: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'FII/DII analysis failed' }, { status: 500 });
  }
}
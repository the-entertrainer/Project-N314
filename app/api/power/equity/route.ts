import { NextRequest, NextResponse } from 'next/server';
import { fetchEquityFundamentals } from '../../../../lib/powerData';
import { groqEquityDeep } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';
import { getStockBySymbol, getNifty500Registry } from '../../../../lib/nifty500';

export async function POST(request: NextRequest) {
  try {
    const { symbol: rawSymbol } = await request.json();
    if (!rawSymbol?.trim()) {
      return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    const normalized = rawSymbol.toUpperCase().includes('.NS')
      ? rawSymbol.toUpperCase()
      : `${rawSymbol.toUpperCase()}.NS`;

    const stock = getStockBySymbol(normalized);
    const fundamentals = await fetchEquityFundamentals(normalized);

    const peers = getNifty500Registry()
      .filter((s) => s.industry === stock?.industry && s.symbol !== normalized)
      .slice(0, 3)
      .map((s) => s.symbol)
      .join(',');

    const payload = `sym:${normalized}|name:${stock?.companyName || fundamentals.company_name}|sector:${stock?.industry || 'N/A'}|price:${fundamentals.current_price}|pe:${fundamentals.pe_ratio ?? 'NA'}|yoy:${fundamentals.yoy_growth_pct}%|slope60:${fundamentals.trend_60d_slope}|sup:${fundamentals.support}|res:${fundamentals.resistance}|peers:${peers}|closes:${fundamentals.recent_closes}`;

    const raw = await groqEquityDeep(payload);
    const ai = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      data: {
        symbol: normalized,
        company_name: stock?.companyName || fundamentals.company_name,
        sector: stock?.industry || '—',
        pe_ratio: fundamentals.pe_ratio,
        buy_zone: ai.buy_zone || `₹${fundamentals.support}–₹${fundamentals.current_price}`,
        target_price: ai.target_price || `₹${fundamentals.resistance}`,
        risks: Array.isArray(ai.risks) ? ai.risks.slice(0, 3) : [],
        catalysts: Array.isArray(ai.catalysts) ? ai.catalysts.slice(0, 3) : [],
        sector_health: ai.sector_health || '',
        summary: ai.summary || '',
        growth_trend: ai.growth_trend || `${fundamentals.yoy_growth_pct}% YoY`,
      },
    });
  } catch (e) {
    if (e instanceof GroqRateLimitError) {
      return NextResponse.json({ success: false, error: 'Groq rate limit. Try again shortly.', code: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Equity analysis failed' }, { status: 500 });
  }
}
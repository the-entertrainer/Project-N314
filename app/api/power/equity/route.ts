import { NextRequest, NextResponse } from 'next/server';
import { fetchEquityFundamentals } from '../../../../lib/powerData';
import { groqEquityDeep } from '../../../../lib/powerGroq';
import { GroqRateLimitError } from '../../../../lib/groq';
import { getStockBySymbol, getNifty500Registry } from '../../../../lib/nifty500';
import { parseAiBreakdown, parseStringArray } from '../../../../lib/powerValidate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sector = body.sector || 'Information Technology';
    const timeline = body.timeline === '5+' ? '5+' : '1-3';
    let normalized = body.symbol?.trim()
      ? body.symbol.toUpperCase().includes('.NS')
        ? body.symbol.toUpperCase()
        : `${body.symbol.toUpperCase()}.NS`
      : '';

    if (!normalized) {
      const peer = getNifty500Registry().find((s) => s.industry === sector);
      normalized = peer?.symbol || 'RELIANCE.NS';
    }

    const stock = getStockBySymbol(normalized);
    const fundamentals = await fetchEquityFundamentals(normalized);
    const peers = getNifty500Registry()
      .filter((s) => s.industry === (stock?.industry || sector) && s.symbol !== normalized)
      .slice(0, 3)
      .map((s) => s.symbol)
      .join(',');

    const payload = `timeline:${timeline}y|sector:${sector}|sym:${normalized}|name:${stock?.companyName || fundamentals.company_name}|price:${fundamentals.current_price}|pe:${fundamentals.pe_ratio ?? 'NA'}|yoy:${fundamentals.yoy_growth_pct}%|slope60:${fundamentals.trend_60d_slope}|sup:${fundamentals.support}|res:${fundamentals.resistance}|peers:${peers}|closes:${fundamentals.recent_closes}`;

    const raw = await groqEquityDeep(payload);
    const ai = JSON.parse(raw) as Record<string, unknown>;
    const breakdown = parseAiBreakdown(ai);

    return NextResponse.json({
      success: true,
      data: {
        ...breakdown,
        symbol: normalized,
        company_name: stock?.companyName || fundamentals.company_name,
        sector: stock?.industry || sector,
        timeline: timeline === '5+' ? '5+ years' : '1-3 years',
        pe_ratio: fundamentals.pe_ratio,
        buy_zone: String(ai.buy_zone || `₹${fundamentals.support}–₹${fundamentals.current_price}`).slice(0, 120),
        target_price: String(ai.target_price || `₹${fundamentals.resistance}`).slice(0, 120),
        risks: parseStringArray(ai.risks, 4),
        catalysts: parseStringArray(ai.catalysts, 4),
        sector_health: String(ai.sector_health || '').slice(0, 300),
        growth_trend: String(ai.growth_trend || `${fundamentals.yoy_growth_pct}% YoY`).slice(0, 200),
        investment_plan: parseStringArray(ai.investment_plan, 5),
      },
    });
  } catch (e) {
    if (e instanceof GroqRateLimitError) {
      return NextResponse.json({ success: false, error: 'Groq rate limit. Try again shortly.', code: 'RATE_LIMIT' }, { status: 429 });
    }
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Equity analysis failed' }, { status: 500 });
  }
}

export async function GET() {
  return POST(new NextRequest('http://local', { method: 'POST', body: '{}' }));
}
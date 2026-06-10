import { NextRequest, NextResponse } from 'next/server';
import { getStockBySymbol } from '../../../lib/nifty500';
import { fetchFromSources, formatHeadlinesForGroq } from '../../../lib/tickerNews';
import { callGroqPortfolio, GroqRateLimitError } from '../../../lib/groq';
import type {
  PortfolioHoldingInput,
  PortfolioInsight,
  UpcomingEvent,
} from '../../../types/portfolio';

function formatPortfolioPayload(
  holdings: PortfolioHoldingInput[],
  totals: {
    portfolioValue: number;
    totalInvested: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
  }
) {
  const lines = holdings.map((h) => {
    const pnl =
      h.currentPrice != null
        ? (((h.currentPrice - h.avgPrice) / h.avgPrice) * 100).toFixed(1)
        : '0';
    return `${h.symbol}|qty:${h.quantity}|avg:${h.avgPrice}|now:${h.currentPrice ?? h.avgPrice}|chg:${h.changePercent?.toFixed(1) ?? pnl}%|${h.companyName ?? ''}`;
  });
  return `value:${totals.portfolioValue}|invested:${totals.totalInvested}|pnl:${totals.totalGainLoss}|pnl%:${totals.totalGainLossPercent.toFixed(1)}\n${lines.join('\n')}`;
}

function validateInsight(raw: Record<string, unknown>): PortfolioInsight {
  const tracking = (raw.current_tracking as Record<string, unknown>) || {};
  const predictions = (raw.predictions as Record<string, unknown>) || {};
  const sentiment = tracking.overall_sentiment as string;

  const normalizedSentiment =
    sentiment === 'Bullish' || sentiment === 'Bearish' || sentiment === 'Neutral'
      ? sentiment
      : 'Neutral';

  const holdingsSnapshot = Array.isArray(tracking.holdings_snapshot)
    ? tracking.holdings_snapshot
        .map((h) => {
          const item = h as Record<string, unknown>;
          return {
            symbol: String(item.symbol || '').slice(0, 20),
            status: String(item.status || '').slice(0, 120),
            pnl_view: String(item.pnl_view || '').slice(0, 120),
          };
        })
        .filter((h) => h.symbol)
    : [];

  const upcomingEvents: UpcomingEvent[] = Array.isArray(raw.upcoming_events)
    ? raw.upcoming_events
        .map((e) => {
          const item = e as Record<string, unknown>;
          const impact = item.impact as string;
          const normalizedImpact: UpcomingEvent['impact'] =
            impact === 'positive' || impact === 'negative' || impact === 'neutral'
              ? impact
              : 'neutral';
          return {
            event: String(item.event || '').slice(0, 160),
            date_or_timing: String(item.date_or_timing || 'Upcoming').slice(0, 60),
            impact: normalizedImpact,
            affected_symbols: Array.isArray(item.affected_symbols)
              ? item.affected_symbols.map((s) => String(s).slice(0, 20)).slice(0, 5)
              : [],
          };
        })
        .filter((e) => e.event)
        .slice(0, 4)
    : [];

  const riskAlerts = Array.isArray(raw.risk_alerts)
    ? raw.risk_alerts.map((r) => String(r).slice(0, 160)).slice(0, 3)
    : [];

  return {
    portfolio_summary: String(raw.portfolio_summary || 'Portfolio tracking active.').slice(0, 400),
    current_tracking: {
      overall_sentiment: normalizedSentiment,
      total_pnl_outlook: String(tracking.total_pnl_outlook || '').slice(0, 200),
      holdings_snapshot: holdingsSnapshot,
    },
    predictions: {
      short_term_7d: String(predictions.short_term_7d || '').slice(0, 200),
      medium_term_30d: String(predictions.medium_term_30d || '').slice(0, 200),
    },
    upcoming_events: upcomingEvents,
    daily_advice: String(raw.daily_advice || '').slice(0, 300),
    risk_alerts: riskAlerts.length ? riskAlerts : ['Monitor market volatility closely'],
  };
}

async function fetchPortfolioNews(holdings: PortfolioHoldingInput[]) {
  const gnewsKey = process.env.GNEWS_API_KEY;
  const symbols = holdings
    .map((h) => h.symbol.replace('.NS', ''))
    .slice(0, 6)
    .join(' ');
  const names = holdings
    .map((h) => h.companyName?.split(' ')[0])
    .filter(Boolean)
    .slice(0, 4)
    .join(' ');

  const queries = [
    `India ${symbols} ${names} stocks earnings results`,
    'India RBI monetary policy Nifty earnings calendar',
  ];

  const headlines = [];
  const seen = new Set<string>();

  for (const q of queries) {
    const items = await fetchFromSources(q, 6, gnewsKey);
    for (const item of items) {
      const key = item.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        headlines.push(item);
      }
    }
    if (headlines.length >= 10) break;
  }

  return headlines.slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const holdings: PortfolioHoldingInput[] = body.holdings || [];

    if (!holdings.length) {
      return NextResponse.json({ error: 'Portfolio holdings required' }, { status: 400 });
    }

    const enriched = holdings.map((h) => {
      const stock = getStockBySymbol(h.symbol);
      return {
        ...h,
        companyName: h.companyName || stock?.companyName,
        industry: h.industry || stock?.industry,
      };
    });

    const totals = {
      portfolioValue: Number(body.portfolioValue) || 0,
      totalInvested: Number(body.totalInvested) || 0,
      totalGainLoss: Number(body.totalGainLoss) || 0,
      totalGainLossPercent: Number(body.totalGainLossPercent) || 0,
    };

    const headlines = await fetchPortfolioNews(enriched);
    const newsPayload =
      headlines.length > 0
        ? formatHeadlinesForGroq(headlines)
        : `${new Date().toISOString().slice(0, 10)}|India market macro and earnings season`;

    const portfolioPayload = formatPortfolioPayload(enriched, totals);
    const rawAnalysis = await callGroqPortfolio(portfolioPayload, newsPayload);
    const parsed = JSON.parse(rawAnalysis);
    const insight = validateInsight(parsed);

    return NextResponse.json({
      success: true,
      insight,
      headline_count: headlines.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof GroqRateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Groq rate limit reached. Cached insights shown if available.',
          code: 'RATE_LIMIT',
        },
        { status: 429 }
      );
    }

    const message = error instanceof Error ? error.message : 'Portfolio analysis failed';
    console.error('Portfolio API error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
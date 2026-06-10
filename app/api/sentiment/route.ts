import { NextRequest, NextResponse } from 'next/server';
import { getStockBySymbol } from '../../../lib/nifty500';
import { fetchTickerNews, formatHeadlinesForGroq } from '../../../lib/tickerNews';
import { callGroqSentiment, GroqRateLimitError } from '../../../lib/groq';
import type { SentimentResult } from '../../../types/screener';

function validateSentiment(raw: Record<string, unknown>): SentimentResult {
  const sentiment = raw.sentiment as string;
  const score = Number(raw.sentiment_score);
  const trend = String(raw.predicted_trend || '').slice(0, 200);
  const drivers = Array.isArray(raw.news_drivers)
    ? raw.news_drivers.map((d) => String(d).slice(0, 120)).slice(0, 3)
    : [];

  const normalizedSentiment =
    sentiment === 'Bullish' || sentiment === 'Bearish' || sentiment === 'Neutral'
      ? sentiment
      : score > 0.15
        ? 'Bullish'
        : score < -0.15
          ? 'Bearish'
          : 'Neutral';

  return {
    sentiment: normalizedSentiment,
    sentiment_score: Math.max(-1, Math.min(1, isNaN(score) ? 0 : score)),
    predicted_trend: trend || 'Insufficient data for trend projection.',
    news_drivers: drivers.length ? drivers : ['Market conditions', 'Sector dynamics', 'Macro environment'],
    news_scope: 'company',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawTicker = body.ticker || body.symbol;

    if (!rawTicker?.trim()) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const stock = getStockBySymbol(rawTicker);
    if (!stock) {
      return NextResponse.json(
        { error: 'Ticker not found in Nifty 500 registry. Use format e.g. RELIANCE.NS' },
        { status: 404 }
      );
    }

    const { headlines, scope, isMacro } = await fetchTickerNews(
      stock.symbol,
      stock.companyName,
      stock.industry
    );

    if (headlines.length === 0) {
      return NextResponse.json(
        { error: 'Unable to fetch news headlines. Try again shortly.' },
        { status: 503 }
      );
    }

    const newsPayload = formatHeadlinesForGroq(headlines);
    const rawAnalysis = await callGroqSentiment(
      stock.symbol,
      stock.companyName,
      stock.industry,
      newsPayload,
      scope,
      isMacro
    );

    const parsed = JSON.parse(rawAnalysis);
    const analysis = validateSentiment(parsed);
    analysis.news_scope = scope;

    return NextResponse.json({
      success: true,
      ticker: stock.symbol,
      companyName: stock.companyName,
      industry: stock.industry,
      headline_count: headlines.length,
      analysis,
    });
  } catch (error: unknown) {
    if (error instanceof GroqRateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Groq rate limit reached. Please wait 30–60 seconds before trying again.',
          code: 'RATE_LIMIT',
        },
        { status: 429 }
      );
    }

    const message = error instanceof Error ? error.message : 'Sentiment analysis failed';
    console.error('Sentiment error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
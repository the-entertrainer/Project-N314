import { NextRequest, NextResponse } from 'next/server';
import { fetchRelevantNews } from '../../../lib/newsFetcher';
import {
  fetchStockBundle,
  fetchChart,
  metaToQuote,
  GLOBAL_INDICES,
} from '../../../lib/marketData';
import {
  buildTechnicalSnapshot,
  buildChartSeries,
} from '../../../lib/technicalAnalysis';
import { callGroq, ANALYSIS_SCHEMA } from '../../../lib/groq';
import type { GroqAnalysis, GlobalIndexSnapshot } from '../../../types/analysis';

const INDEX_LABELS: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^DJI': 'Dow Jones',
  '^IXIC': 'NASDAQ',
  '^NSEI': 'NIFTY 50',
  '^NSEBANK': 'BANK NIFTY',
};

function normalizeSymbol(raw: string) {
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed.includes('.') && /^[A-Z]+$/.test(trimmed)) {
    return `${trimmed}.NS`;
  }
  return trimmed;
}

async function fetchGlobalIndices(): Promise<GlobalIndexSnapshot[]> {
  const results = await Promise.allSettled(
    GLOBAL_INDICES.map(async (symbol) => {
      const chart = await fetchChart(symbol, '5d');
      const quote = metaToQuote(chart.meta);
      return {
        symbol,
        name: INDEX_LABELS[symbol] || symbol,
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent ?? 0,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<GlobalIndexSnapshot> => r.status === 'fulfilled')
    .map((r) => r.value);
}

function buildAnalysisPrompt(
  symbol: string,
  quote: ReturnType<typeof metaToQuote>,
  technicals: ReturnType<typeof buildTechnicalSnapshot>,
  news: Awaited<ReturnType<typeof fetchRelevantNews>>,
  globalIndices: GlobalIndexSnapshot[],
  historyStats: { high30: number; low30: number; avgVolume: number }
) {
  const newsBlock = news
    .slice(0, 12)
    .map((n, i) => `${i + 1}. [${n.category}] ${n.title} (${n.source}, ${n.publishedAt})`)
    .join('\n');

  const globalBlock = globalIndices
    .map((g) => `${g.name}: ${g.price.toFixed(2)} (${g.changePercent >= 0 ? '+' : ''}${g.changePercent.toFixed(2)}%)`)
    .join('\n');

  return `You are N314 Quant Intelligence — an expert equity analyst combining technical analysis, global macro news, and event-driven reasoning.

Analyze ${symbol} (${quote.shortName || 'Unknown'}) and produce a rigorous investment intelligence report.

## CURRENT QUOTE (verified data — do not invent)
- Price: ${quote.regularMarketPrice}
- Daily Change: ${quote.regularMarketChangePercent?.toFixed(2) ?? 'N/A'}%
- Volume: ${quote.regularMarketVolume ?? 'N/A'}

## TECHNICAL INDICATORS (pre-computed — use these exact values)
- RSI(14): ${technicals.rsi?.toFixed(2) ?? 'N/A'}
- SMA(50): ${technicals.sma50?.toFixed(2) ?? 'N/A'}
- SMA(200): ${technicals.sma200?.toFixed(2) ?? 'N/A'}
- MACD: ${technicals.macd?.toFixed(4) ?? 'N/A'}
- MACD Signal: ${technicals.macdSignal?.toFixed(4) ?? 'N/A'}
- 30-day Trend: ${technicals.trend30d.toFixed(2)}%
- Volatility: ${technicals.volatility.toFixed(2)}%
- Support: ${technicals.support.toFixed(2)}
- Resistance: ${technicals.resistance.toFixed(2)}
- 30d High: ${historyStats.high30.toFixed(2)}
- 30d Low: ${historyStats.low30.toFixed(2)}
- Avg Volume: ${historyStats.avgVolume.toFixed(0)}

## GLOBAL MARKET CONTEXT
${globalBlock}

## RECENT NEWS (analyze causal impact on this stock)
${newsBlock || 'No recent news available — note higher uncertainty.'}

## INSTRUCTIONS
1. Cross-reference news events with potential stock impact (supply chain, regulation, earnings, geopolitics, sector rotation).
2. Weight technical signals AND news sentiment. Flag contradictions in reasoning_chain.
3. Set error_margin_pct higher (8-20) when news is sparse or signals conflict; lower (3-8) when aligned.
4. Price targets must be realistic relative to current price ${quote.regularMarketPrice} and support/resistance.
5. Map top 5-8 news items to news_impacts with impact_score from -10 (very bearish) to +10 (very bullish).
6. Provide 4-6 technical_signals using the pre-computed data.
7. Be specific about WHICH global events could affect this company.`;
}

export async function POST(request: NextRequest) {
  try {
    const { symbol: rawSymbol } = await request.json();
    if (!rawSymbol?.trim()) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const symbol = normalizeSymbol(rawSymbol);

    const stockBundle = await fetchStockBundle(symbol);

    const [news, globalIndices] = await Promise.all([
      fetchRelevantNews(symbol, stockBundle.quote.shortName),
      fetchGlobalIndices(),
    ]);

    const { quote, history } = stockBundle;
    const closes = history.map((h) => h.close);
    const highs = history.map((h) => h.high);
    const lows = history.map((h) => h.low);
    const volumes = history.map((h) => h.volume);
    const dates = history.map((h) => h.date);

    const technicals = buildTechnicalSnapshot(closes, highs, lows);
    const chartSeries = buildChartSeries(dates, closes, volumes);

    const recentCloses = closes.slice(-30);
    const recentVolumes = volumes.slice(-30);
    const historyStats = {
      high30: Math.max(...recentCloses),
      low30: Math.min(...recentCloses),
      avgVolume: recentVolumes.reduce((a, b) => a + b, 0) / (recentVolumes.length || 1),
    };

    const prompt = buildAnalysisPrompt(symbol, quote, technicals, news, globalIndices, historyStats);

    const rawAnalysis = await callGroq(
      [
        {
          role: 'system',
          content:
            'You are a quantitative equity analyst. Output only valid JSON matching the schema. Ground all claims in provided data. Never fabricate prices or news.',
        },
        { role: 'user', content: prompt },
      ],
      { jsonSchema: ANALYSIS_SCHEMA, schemaName: 'stock_analysis', strict: true }
    );

    const analysis: GroqAnalysis = JSON.parse(rawAnalysis);

    return NextResponse.json({
      success: true,
      data: {
        symbol,
        quote,
        technicals,
        chartSeries,
        history,
        news,
        globalIndices,
        analysis,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    console.error('Analyze error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import type {
  SentimentAnalysis, NewsArticle, HistoricalDataPoint, PointReason,
  StockQuote, HistoricalBar, StockAiAnalysis, AdvisorOutput,
  FiiDiiFlow, IndexQuote,
} from '../types';
import { Sentiment, Recommendation } from '../types';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) console.warn('GEMINI_API_KEY is not set.');
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function getModel() {
  if (!genAI) throw new Error('GEMINI_API_KEY is not set.');
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings: SAFETY,
    generationConfig: { responseMimeType: 'application/json' },
  });
}

function parseJson(text: string): any {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  let raw = match?.[1]?.trim() ?? text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON from AI model.');
  }
}

// ─── Stock Deep Dive Analysis ─────────────────────────────────────────────────

export async function analyzeStock(
  q: StockQuote,
  _bars: HistoricalBar[],
  headlines: string[],
): Promise<StockAiAnalysis> {
  const pctVsMa50  = q.ma50  ? (((q.price - q.ma50)  / q.ma50)  * 100).toFixed(1) : 'N/A';
  const pctVsMa200 = q.ma200 ? (((q.price - q.ma200) / q.ma200) * 100).toFixed(1) : 'N/A';

  const prompt = `You are a SEBI-registered research analyst. Analyze this NSE-listed stock using ONLY the provided real-time data. Do NOT fabricate numbers.

STOCK: ${q.ticker} (${q.name}) | NSE | Sector: ${q.sector}
CMP: ₹${q.price.toFixed(2)} | Change: ${q.changePct.toFixed(2)}% | 52W H: ₹${q.high52w} | 52W L: ₹${q.low52w}
RSI-14: ${q.rsi14?.toFixed(1) ?? 'N/A'} | vs MA50: ${pctVsMa50}% | vs MA200: ${pctVsMa200}%
Volume Ratio: ${q.volumeRatio.toFixed(2)}x | Beta: ${q.beta?.toFixed(2) ?? 'N/A'}
P/E: ${q.pe?.toFixed(1) ?? 'N/A'} | P/B: ${q.pb?.toFixed(1) ?? 'N/A'} | EPS: ₹${q.eps?.toFixed(2) ?? 'N/A'} | Div Yield: ${q.divYield?.toFixed(2) ?? 'N/A'}%
Score: ${q.score ?? 'N/A'}/100 | F&O Eligible: ${q.isFno}
${headlines.length > 0 ? `\nRecent Headlines:\n${headlines.slice(0, 4).map((h, i) => `${i + 1}. ${h}`).join('\n')}` : ''}

Return ONLY this JSON (no markdown):
{
  "shortTerm": {
    "action": "Buy|Hold|Sell",
    "entry": <number near CMP>,
    "target": <number>,
    "stopLoss": <number>,
    "confidence": <0-100>,
    "reasoning": "<2 sentences citing specific data above>"
  },
  "longTerm": {
    "thesis": "<2 sentences>",
    "timeframe": "<e.g. 6-12 months>"
  },
  "risks": ["<risk1>", "<risk2>", "<risk3>"],
  "sentimentScore": <-1 to 1>,
  "keyLevels": { "support": <number>, "resistance": <number> }
}`;

  const result = await getModel().generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const parsed = parseJson(result.response.text());
  return {
    symbol:       q.ticker,
    shortTerm:    { ...parsed.shortTerm, action: parsed.shortTerm.action as Recommendation },
    longTerm:     parsed.longTerm,
    risks:        parsed.risks ?? [],
    sentimentScore: parsed.sentimentScore ?? 0,
    keyLevels:    parsed.keyLevels ?? { support: q.low52w, resistance: q.high52w },
    generatedAt:  Date.now(),
  };
}

// ─── Daily AI Advisor ─────────────────────────────────────────────────────────

export async function getAdvisorOutput(
  gainers:   StockQuote[],
  losers:    StockQuote[],
  topScored: StockQuote[],
  fiiDii:    FiiDiiFlow | null,
  nifty:     IndexQuote | null,
): Promise<AdvisorOutput> {
  const fmtQ = (q: StockQuote) =>
    `${q.ticker}: ₹${q.price.toFixed(0)} | Chg: ${q.changePct.toFixed(1)}% | Vol: ${q.volumeRatio.toFixed(1)}x | PE: ${q.pe?.toFixed(1) ?? 'N/A'} | Score: ${q.score ?? 'N/A'}`;

  const prompt = `You are a senior portfolio manager. Based on TODAY's live NSE market data below, provide actionable trading recommendations. Do NOT guess or use training data prices.

${nifty ? `NIFTY 50: ${nifty.price.toFixed(2)} (${nifty.changePct.toFixed(2)}%)` : 'NIFTY: data unavailable'}
${fiiDii ? `FII Net: ₹${fiiDii.fiiNet.toFixed(0)} Cr | DII Net: ₹${fiiDii.diiNet.toFixed(0)} Cr` : 'FII/DII: data unavailable'}

TOP GAINERS TODAY:
${gainers.map(fmtQ).join('\n')}

TOP LOSERS TODAY:
${losers.map(fmtQ).join('\n')}

HIGH-SCORE OPPORTUNITIES (by composite score):
${topScored.slice(0, 8).map(fmtQ).join('\n')}

Return ONLY this JSON (no markdown):
{
  "shortPicks": [
    { "ticker": "...", "action": "Buy|Sell", "entry": <number>, "target": <number>, "sl": <number>, "reasoning": "<1-2 sentences citing data above>" }
  ],
  "longPicks": [
    { "ticker": "...", "thesis": "<2 sentences>", "timeframe": "<3-12 months>" }
  ],
  "avoidList": [
    { "ticker": "...", "reason": "<1 sentence>" }
  ],
  "niftyOutlook": {
    "direction": "up|down|sideways",
    "keyLevel": <important Nifty level>,
    "reasoning": "<1-2 sentences>"
  }
}

Rules:
- shortPicks: 3-5 entries, only from stocks listed above
- longPicks: 3-5 entries, focus on high score + low PE + strong fundamentals
- avoidList: 1-3 entries, focus on worst-scoring or overbought
- All prices must be close to the CMP shown above`;

  const result = await getModel().generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const parsed = parseJson(result.response.text());
  return {
    shortPicks:   parsed.shortPicks   ?? [],
    longPicks:    parsed.longPicks    ?? [],
    avoidList:    parsed.avoidList    ?? [],
    niftyOutlook: parsed.niftyOutlook ?? { direction: 'sideways', keyLevel: 0, reasoning: '' },
    generatedAt:  Date.now(),
  };
}

// ─── Legacy: single-stock AI sentiment (kept for backward compat) ─────────────

function cleanAndParseJson(text: string): any {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const raw = match?.[1]?.trim() ?? text.trim();
  try { return JSON.parse(raw); } catch (e) {
    console.error('Failed to parse JSON:', e);
    throw new Error('Invalid JSON format received from the AI model.');
  }
}

export const getSentimentAnalysis = async (
  companyOrSymbol: string,
  exchange: string,
): Promise<SentimentAnalysis> => {
  if (!genAI) throw new Error('GEMINI_API_KEY environment variable is not set.');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings: SAFETY,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `Analyze the market sentiment for the stock symbol "${companyOrSymbol}" on the "${exchange}" exchange.
Provide a comprehensive analysis based on recent news, financial reports, and market trends.

Respond with a single, valid JSON object only. Do not wrap it in markdown.
{
  "companyName": "string", "stockSymbol": "string",
  "overallSentiment": "Positive"|"Neutral"|"Negative",
  "sentimentScore": number, "summary": "string",
  "positivePoints": [{"point":"string","reason":"string"}],
  "negativePoints": [{"point":"string","reason":"string"}],
  "currentPrice": number, "fiftyTwoWeekHigh": number, "fiftyTwoWeekLow": number,
  "currentVolume": number, "averageVolume": number, "currencySymbol": "string",
  "recommendation": "Buy"|"Hold"|"Sell", "recommendationSummary": "string",
  "aspectSentiment": {"financials":number,"product":number|null,"management":number,"marketPosition":number},
  "newsArticles": [{"title":"string","snippet":"string","uri":"string"}],
  "historicalData": [{"date":"YYYY-MM","price":number|null,"volume":number|null,"sentimentScore":number|null,"ma50":number|null,"ma200":number|null,"rsi14":number|null}],
  "technicalIndicators": {"movingAverage50":number,"movingAverage200":number,"rsi14":number}
}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const parsedData = cleanAndParseJson(result.response.text());

    parsedData.newsArticles = Array.isArray(parsedData.newsArticles)
      ? parsedData.newsArticles.filter((a: any): a is NewsArticle =>
          a && typeof a.title === 'string' && typeof a.uri === 'string' && a.uri.startsWith('http'))
      : [];

    parsedData.historicalData = Array.isArray(parsedData.historicalData)
      ? parsedData.historicalData.filter((p: any): p is HistoricalDataPoint => p && typeof p.date === 'string')
      : [];

    const hasValidPoints = (pts: any[]): pts is PointReason[] =>
      Array.isArray(pts) && pts.every((p) => p && typeof p.point === 'string' && typeof p.reason === 'string');

    if (!parsedData.companyName || !parsedData.stockSymbol ||
        !hasValidPoints(parsedData.positivePoints ?? []) ||
        !hasValidPoints(parsedData.negativePoints ?? [])) {
      throw new Error('Core analysis data is missing or malformed.');
    }

    return { ...parsedData, dataSources: [] } as SentimentAnalysis;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('API key')) throw new Error('Invalid API key.');
      if (error.message.includes('quota'))   throw new Error('API quota exceeded.');
      if (error.message.includes('network')) throw new Error('Network error.');
    }
    throw new Error(`Failed to generate analysis: ${error instanceof Error ? error.message : 'Unknown error'}.`);
  }
};

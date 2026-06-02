import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import type { SentimentAnalysis, NewsArticle, HistoricalDataPoint, PointReason } from '../types';
import { Sentiment, Recommendation } from '../types';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set. Analysis will fail until a key is provided.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function cleanAndParseJson(text: string): any {
  const match = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
  let jsonText = text.trim();
  if (match && match[2]) jsonText = match[2].trim();
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error('Failed to parse JSON:', e, '\nRaw text:', text);
    throw new Error('Invalid JSON format received from the AI model.');
  }
}

export const getSentimentAnalysis = async (
  companyOrSymbol: string,
  exchange: string
): Promise<SentimentAnalysis> => {
  if (!genAI) throw new Error('GEMINI_API_KEY environment variable is not set. Please configure your API key.');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
    Analyze the market sentiment for the stock symbol "${companyOrSymbol}" on the "${exchange}" exchange.
    Provide a comprehensive analysis based on recent news, financial reports, and market trends.
    Include key technical indicators in your analysis.

    Respond with a single, valid JSON object only. Do not wrap it in markdown.

    The JSON must conform exactly to this structure:
    {
      "companyName": "string",
      "stockSymbol": "string",
      "overallSentiment": "Positive" | "Neutral" | "Negative",
      "sentimentScore": number,
      "summary": "string",
      "positivePoints": [ { "point": "string", "reason": "string" } ],
      "negativePoints": [ { "point": "string", "reason": "string" } ],
      "currentPrice": number,
      "fiftyTwoWeekHigh": number,
      "fiftyTwoWeekLow": number,
      "currentVolume": number,
      "averageVolume": number,
      "currencySymbol": "string",
      "recommendation": "Buy" | "Hold" | "Sell",
      "recommendationSummary": "string",
      "aspectSentiment": {
        "financials": number,
        "product": number | null,
        "management": number,
        "marketPosition": number
      },
      "newsArticles": [
        { "title": "string", "snippet": "string", "uri": "string" }
      ],
      "historicalData": [
        {
          "date": "YYYY-MM",
          "price": number | null,
          "volume": number | null,
          "sentimentScore": number | null,
          "ma50": number | null,
          "ma200": number | null,
          "rsi14": number | null
        }
      ],
      "technicalIndicators": {
        "movingAverage50": number,
        "movingAverage200": number,
        "rsi14": number
      }
    }

    Instructions:
    - "historicalData" must be exactly 12 objects (last 12 months), with "price" as the monthly closing price.
    - "aspectSentiment" scores must be between -1.0 and 1.0.
    - "sentimentScore" must be between -1.0 and 1.0.
    - "recommendationSummary" must be a single brief sentence.
    - Include real news articles with valid URIs starting with "http".
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = result.response.text();
    const parsedData = cleanAndParseJson(responseText);

    if (Array.isArray(parsedData.newsArticles)) {
      parsedData.newsArticles = parsedData.newsArticles.filter(
        (a: any): a is NewsArticle =>
          a && typeof a.title === 'string' && typeof a.snippet === 'string' &&
          typeof a.uri === 'string' && a.uri.startsWith('http')
      );
    } else {
      parsedData.newsArticles = [];
    }

    if (Array.isArray(parsedData.historicalData)) {
      parsedData.historicalData = parsedData.historicalData.filter(
        (p: any): p is HistoricalDataPoint => p && typeof p.date === 'string'
      );
    } else {
      parsedData.historicalData = [];
    }

    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;
    const rawSources = (groundingMetadata as any)?.webSearchQueries?.flatMap((q: any) => q.results || []) ?? [];
    const dataSources = Array.from(
      new Map(rawSources.map((r: any) => [r.uri, { uri: r.uri, title: r.title }])).values()
    ) as { uri: string; title: string }[];

    const hasValidPoints = (pts: any[]): pts is PointReason[] =>
      Array.isArray(pts) && pts.every(p => p && typeof p.point === 'string' && typeof p.reason === 'string');

    if (!parsedData.companyName || !parsedData.stockSymbol ||
        !hasValidPoints(parsedData.positivePoints || []) ||
        !hasValidPoints(parsedData.negativePoints || [])) {
      throw new Error('Core analysis data is missing or malformed.');
    }

    return { ...parsedData, dataSources } as SentimentAnalysis;
  } catch (error) {
    console.error('Gemini API error:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('authentication'))
        throw new Error('Invalid API key. Please check your GEMINI_API_KEY.');
      if (error.message.includes('quota') || error.message.includes('limit'))
        throw new Error('API quota exceeded. Please try again later.');
      if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ENOTFOUND'))
        throw new Error('Network error. Please check your internet connection.');
      if (error.message.includes('Invalid JSON') || error.message.includes('parse'))
        throw new Error('Invalid response format from AI. Please try again.');
    }
    throw new Error(`Failed to generate sentiment analysis: ${error instanceof Error ? error.message : 'Unknown error'}.`);
  }
};

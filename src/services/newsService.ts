import type { NewsArticle } from '../types';

const GNEWS_KEY = process.env.GNEWS_API_KEY ?? '';

// GNews API — free tier: 100 req/day
export async function fetchMarketNews(query = 'India stock market NSE BSE Nifty', maxItems = 10): Promise<NewsArticle[]> {
  const url = GNEWS_KEY
    ? `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=${maxItems}&token=${GNEWS_KEY}`
    : null;

  if (url) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return (data.articles ?? []).map((a: any): NewsArticle => ({
          title: a.title,
          snippet: a.description ?? '',
          uri: a.url,
          publishedAt: a.publishedAt,
          source: a.source?.name ?? '',
        }));
      }
    } catch { /* fallthrough to empty */ }
  }

  // If no key or request failed, return empty (the AI Advisor will use Gemini's
  // built-in Google Search grounding instead)
  return [];
}

export async function fetchStockNews(ticker: string): Promise<NewsArticle[]> {
  return fetchMarketNews(`${ticker} NSE India stock`, 8);
}

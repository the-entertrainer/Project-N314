export interface TickerHeadline {
  title: string;
  date: string;
  source: string;
}

export type NewsScope = 'company' | 'sector' | 'macro';

function parseRssHeadlines(xml: string, limit: number): TickerHeadline[] {
  const items: TickerHeadline[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const block = match[1];
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1]?.trim() || 'RSS';
    if (!title) continue;
    items.push({
      title: title.slice(0, 140),
      date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      source: source.slice(0, 30),
    });
  }
  return items;
}

async function fetchGNewsHeadlines(query: string, apiKey: string, limit: number): Promise<TickerHeadline[]> {
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=in&max=${limit}&apikey=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.articles || []).map((a: { title: string; publishedAt: string; source?: { name: string } }) => ({
    title: (a.title || '').slice(0, 140),
    date: (a.publishedAt || '').slice(0, 10),
    source: (a.source?.name || 'GNews').slice(0, 30),
  }));
}

async function fetchRssHeadlines(query: string, limit: number): Promise<TickerHeadline[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  return parseRssHeadlines(await res.text(), limit);
}

async function fetchFromSources(query: string, limit: number, gnewsKey?: string): Promise<TickerHeadline[]> {
  const results: TickerHeadline[] = [];
  const seen = new Set<string>();

  const add = (items: TickerHeadline[]) => {
    for (const item of items) {
      const key = item.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push(item);
      }
    }
  };

  if (gnewsKey) add(await fetchGNewsHeadlines(query, gnewsKey, limit));
  add(await fetchRssHeadlines(query, limit));

  return results.slice(0, limit);
}

export function formatHeadlinesForGroq(headlines: TickerHeadline[]): string {
  return headlines
    .slice(0, 10)
    .map((h) => `${h.date}|${h.title}`)
    .join('\n');
}

export async function fetchTickerNews(
  symbol: string,
  companyName: string,
  industry: string
): Promise<{ headlines: TickerHeadline[]; scope: NewsScope; isMacro: boolean }> {
  const gnewsKey = process.env.GNEWS_API_KEY;
  const base = symbol.replace('.NS', '');
  const limit = 10;

  let headlines = await fetchFromSources(`${companyName} ${base} stock India`, limit, gnewsKey);
  let scope: NewsScope = 'company';
  let isMacro = false;

  if (headlines.length < 3) {
    const sectorHeadlines = await fetchFromSources(
      `India ${industry} sector stocks ${base}`,
      limit,
      gnewsKey
    );
    headlines = [...headlines, ...sectorHeadlines].slice(0, limit);
    if (sectorHeadlines.length > 0) scope = 'sector';
  }

  if (headlines.length < 3) {
    const macroHeadlines = await fetchFromSources(
      'India stock market Nifty Sensex RBI monetary policy',
      limit,
      gnewsKey
    );
    headlines = [...headlines, ...macroHeadlines].slice(0, limit);
    scope = 'macro';
    isMacro = true;
  }

  const macroKeywords = /rbi|fed|interest rate|inflation|crude|oil|geopolit|war|tariff|global market|sensex|nifty|fii|dii|monetary/i;
  if (headlines.length > 0 && headlines.filter((h) => macroKeywords.test(h.title)).length >= headlines.length * 0.6) {
    isMacro = true;
    if (scope === 'company') scope = 'macro';
  }

  return { headlines: headlines.slice(0, 10), scope, isMacro };
}
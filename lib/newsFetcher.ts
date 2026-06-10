export interface NewsArticle {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  category: 'company' | 'sector' | 'global' | 'macro';
}

function parseRssItems(xml: string, category: NewsArticle['category'], limit = 8): NewsArticle[] {
  const items: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const block = match[1];
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
    const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim();
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    const source =
      block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1]?.trim() || 'Google News';

    if (title && link) {
      items.push({
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        source,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        url: link,
        category,
      });
    }
  }

  return items;
}

async function fetchGoogleNewsRss(query: string, category: NewsArticle['category']) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) return [];
  const xml = await res.text();
  return parseRssItems(xml, category);
}

async function fetchGNews(query: string, category: NewsArticle['category'], apiKey: string) {
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=6&apikey=${apiKey}`;
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.articles || []).map((a: { title: string; source?: { name: string }; publishedAt: string; url: string }) => ({
    title: a.title,
    source: a.source?.name || 'GNews',
    publishedAt: a.publishedAt,
    url: a.url,
    category,
  })) as NewsArticle[];
}

function companySearchTerms(symbol: string, companyName?: string) {
  const base = symbol.replace('.NS', '').replace('.BO', '');
  const terms = [base];
  if (companyName) {
    const short = companyName.split(' ').slice(0, 2).join(' ');
    if (short && short !== base) terms.push(short);
  }
  return terms;
}

export async function fetchRelevantNews(symbol: string, companyName?: string): Promise<NewsArticle[]> {
  const gnewsKey = process.env.GNEWS_API_KEY;
  const terms = companySearchTerms(symbol, companyName);
  const companyQuery = `${terms[0]} stock India`;
  const sectorQuery = `${terms[0]} earnings OR results OR quarterly India`;

  const fetches: Promise<NewsArticle[]>[] = [
    fetchGoogleNewsRss(companyQuery, 'company'),
    fetchGoogleNewsRss('India stock market OR Nifty OR Sensex', 'global'),
    fetchGoogleNewsRss('Federal Reserve OR oil prices OR geopolitical markets', 'macro'),
    fetchGoogleNewsRss(sectorQuery, 'sector'),
  ];

  if (gnewsKey) {
    fetches.push(fetchGNews(companyQuery, 'company', gnewsKey));
    fetches.push(fetchGNews('global stock market forecast', 'global', gnewsKey));
  }

  const results = await Promise.allSettled(fetches);
  const merged: NewsArticle[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const article of result.value) {
      const key = article.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(article);
      }
    }
  }

  return merged
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 20);
}
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const NSE_HEADERS = {
  'User-Agent': USER_AGENT,
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.nseindia.com/',
};

const NSE_IPO_PAGE = 'https://www.nseindia.com/market-data/all-upcoming-issues-ipo';

export interface IpoSourceLink {
  title: string;
  url: string;
  publisher: string;
  date: string;
}

export interface IpoKeyNumbers {
  issue_price: number | null;
  price_range_low: number | null;
  price_range_high: number | null;
  shares_offered: number | null;
  subscription_times: number | null;
  current_price: number | null;
  listing_gain_pct: number | null;
  issue_start: string | null;
  issue_end: string | null;
  listing_date: string | null;
}

export interface IpoFactItem {
  label: string;
  value: string;
  source: string;
}

export interface IpoSentimentBacking {
  metric: string;
  value: string;
  implication: string;
}

export interface IpoFactRecord {
  symbol: string;
  name: string;
  status: 'upcoming' | 'recent' | 'active';
  security_type: string;
  numbers: IpoKeyNumbers;
  facts: IpoFactItem[];
  sources: IpoSourceLink[];
  sentiment_backing: IpoSentimentBacking[];
  headlines: IpoSourceLink[];
}

interface NseCurrentRow {
  companyName?: string;
  symbol?: string;
  issueStartDate?: string;
  issueEndDate?: string;
  series?: string;
  status?: string;
  noOfSharesOffered?: string;
  noOfsharesBid?: string;
  noOfTime?: string;
}

interface NsePastRow {
  company?: string;
  companyName?: string;
  symbol?: string;
  ipoStartDate?: string;
  ipoEndDate?: string;
  issuePrice?: string;
  listingDate?: string;
  priceRange?: string;
  securityType?: string;
}

export interface IpoHeadlineWithUrl {
  title: string;
  date: string;
  source: string;
  url: string;
}

function parseNseDate(value?: string): Date | null {
  if (!value || value === '-') return null;
  const normalized = value.replace(/-/g, ' ');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseMoney(value?: string): number | null {
  if (!value || value === '-') return null;
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function parsePriceRange(value?: string): { low: number | null; high: number | null } {
  if (!value) return { low: null, high: null };
  const nums = value.match(/[\d.]+/g)?.map((n) => parseFloat(n)) || [];
  if (nums.length >= 2) return { low: nums[0], high: nums[1] };
  if (nums.length === 1) return { low: nums[0], high: nums[0] };
  return { low: null, high: null };
}

function parseSubscription(value?: string): number | null {
  if (!value) return null;
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : null;
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

async function nseFetch<T>(path: string): Promise<T | null> {
  try {
    await fetch('https://www.nseindia.com', { headers: NSE_HEADERS, cache: 'no-store' });
    const res = await fetch(`https://www.nseindia.com${path}`, { headers: NSE_HEADERS, cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === 'number' && price > 0 ? price : null;
  } catch {
    return null;
  }
}

function nseSource(title: string): IpoSourceLink {
  return {
    title,
    url: NSE_IPO_PAGE,
    publisher: 'NSE India',
    date: new Date().toISOString().slice(0, 10),
  };
}

function buildSentimentBacking(numbers: IpoKeyNumbers, status: string): IpoSentimentBacking[] {
  const backing: IpoSentimentBacking[] = [];

  if (numbers.subscription_times != null) {
    const sub = numbers.subscription_times;
    backing.push({
      metric: 'Subscription demand',
      value: `${sub}x`,
      implication: sub >= 10 ? 'Very strong investor demand' : sub >= 3 ? 'Healthy demand' : sub >= 1 ? 'Moderate demand' : 'Weak demand',
    });
  }

  if (numbers.listing_gain_pct != null) {
    const gain = numbers.listing_gain_pct;
    backing.push({
      metric: 'Listing-day performance',
      value: `${gain >= 0 ? '+' : ''}${gain}%`,
      implication: gain >= 25 ? 'Strong listing pop' : gain >= 0 ? 'Positive listing' : 'Listed below issue price',
    });
  }

  if (numbers.current_price != null && numbers.issue_price != null) {
    const postGain = ((numbers.current_price - numbers.issue_price) / numbers.issue_price) * 100;
    backing.push({
      metric: 'Post-listing return',
      value: `${postGain >= 0 ? '+' : ''}${Math.round(postGain * 10) / 10}%`,
      implication: postGain >= 15 ? 'Price holding above issue' : postGain >= 0 ? 'Slight premium to issue' : 'Trading below issue price',
    });
  }

  if (status === 'active' || status === 'upcoming') {
    if (numbers.price_range_high != null && numbers.issue_price != null) {
      const atTop = numbers.issue_price >= numbers.price_range_high * 0.98;
      backing.push({
        metric: 'Pricing vs band',
        value: atTop ? 'Top of price band' : 'Mid/bottom of band',
        implication: atTop ? 'Priced aggressively — less room on listing day' : 'Some discount to top of band',
      });
    }
  }

  return backing;
}

function deriveSentiment(backing: IpoSentimentBacking[]): 'Bullish' | 'Bearish' | 'Neutral' {
  if (backing.length === 0) return 'Neutral';
  let score = 0;
  for (const item of backing) {
    const imp = item.implication.toLowerCase();
    if (imp.includes('strong') || imp.includes('healthy') || imp.includes('positive') || imp.includes('holding')) score += 1;
    if (imp.includes('weak') || imp.includes('below') || imp.includes('aggressive')) score -= 1;
  }
  if (score >= 2) return 'Bullish';
  if (score <= -1) return 'Bearish';
  return 'Neutral';
}

function buildFacts(
  record: Omit<IpoFactRecord, 'facts' | 'sources' | 'sentiment_backing' | 'headlines'>
): IpoFactItem[] {
  const { numbers, security_type, status } = record;
  const facts: IpoFactItem[] = [];

  if (numbers.issue_price != null) {
    facts.push({ label: 'Issue price', value: `₹${numbers.issue_price}`, source: 'NSE India' });
  }
  if (numbers.price_range_low != null && numbers.price_range_high != null) {
    facts.push({
      label: 'Price band',
      value: `₹${numbers.price_range_low} – ₹${numbers.price_range_high}`,
      source: 'NSE India',
    });
  }
  if (numbers.shares_offered != null) {
    facts.push({
      label: 'Shares offered',
      value: numbers.shares_offered.toLocaleString('en-IN'),
      source: 'NSE India',
    });
  }
  if (numbers.subscription_times != null) {
    facts.push({
      label: 'Subscription',
      value: `${numbers.subscription_times}x`,
      source: 'NSE India',
    });
  }
  if (numbers.issue_start && numbers.issue_end) {
    facts.push({
      label: 'Issue window',
      value: `${numbers.issue_start} → ${numbers.issue_end}`,
      source: 'NSE India',
    });
  }
  if (numbers.listing_date) {
    facts.push({ label: 'Listing date', value: numbers.listing_date, source: 'NSE India' });
  }
  if (numbers.current_price != null) {
    facts.push({
      label: 'Current market price',
      value: `₹${numbers.current_price}`,
      source: 'Yahoo Finance',
    });
  }
  if (numbers.listing_gain_pct != null) {
    facts.push({
      label: 'Listing-day gain',
      value: `${numbers.listing_gain_pct >= 0 ? '+' : ''}${numbers.listing_gain_pct}%`,
      source: 'NSE + Yahoo Finance',
    });
  }

  facts.push({
    label: 'Segment',
    value: `${security_type} · ${status === 'active' ? 'Open now' : status}`,
    source: 'NSE India',
  });

  return facts;
}

function normalizeRecord(
  partial: Omit<IpoFactRecord, 'facts' | 'sources' | 'sentiment_backing' | 'headlines'>
): IpoFactRecord {
  const sentiment_backing = buildSentimentBacking(partial.numbers, partial.status);
  return {
    ...partial,
    facts: buildFacts(partial),
    sources: [nseSource(`${partial.name} (${partial.symbol}) IPO data`)],
    sentiment_backing,
    headlines: [],
  };
}

function mapCurrentRow(row: NseCurrentRow, pastMatch?: NsePastRow): IpoFactRecord {
  const range = parsePriceRange(pastMatch?.priceRange);
  const issuePrice = parseMoney(pastMatch?.issuePrice) ?? range.high ?? range.low;
  const subscription = parseSubscription(row.noOfTime);
  const sharesOffered = parseMoney(row.noOfSharesOffered);

  const numbers: IpoKeyNumbers = {
    issue_price: issuePrice,
    price_range_low: range.low,
    price_range_high: range.high,
    shares_offered: sharesOffered,
    subscription_times: subscription,
    current_price: null,
    listing_gain_pct: null,
    issue_start: row.issueStartDate || pastMatch?.ipoStartDate || null,
    issue_end: row.issueEndDate || pastMatch?.ipoEndDate || null,
    listing_date: null,
  };

  return normalizeRecord({
    symbol: String(row.symbol || '').toUpperCase(),
    name: String(row.companyName || pastMatch?.company || row.symbol || 'Unknown'),
    status: 'active',
    security_type: row.series || pastMatch?.securityType || 'IPO',
    numbers,
  });
}

function mapPastRow(row: NsePastRow, status: 'upcoming' | 'recent'): IpoFactRecord {
  const range = parsePriceRange(row.priceRange);
  const issuePrice = parseMoney(row.issuePrice) ?? range.high ?? range.low;
  const numbers: IpoKeyNumbers = {
    issue_price: issuePrice,
    price_range_low: range.low,
    price_range_high: range.high,
    shares_offered: null,
    subscription_times: null,
    current_price: null,
    listing_gain_pct: null,
    issue_start: row.ipoStartDate || null,
    issue_end: row.ipoEndDate || null,
    listing_date: row.listingDate && row.listingDate !== '-' ? row.listingDate : null,
  };

  return normalizeRecord({
    symbol: String(row.symbol || '').toUpperCase(),
    name: String(row.company || row.companyName || row.symbol || 'Unknown'),
    status,
    security_type: row.securityType || 'IPO',
    numbers,
  });
}

export async function fetchIpoHeadlinesWithUrls(
  filter: 'upcoming' | 'recent',
  symbols: string[]
): Promise<IpoHeadlineWithUrl[]> {
  const gnewsKey = process.env.GNEWS_API_KEY;
  const queries =
    filter === 'upcoming'
      ? ['India IPO subscription open 2026', 'India upcoming IPO price band 2026']
      : ['India IPO listing gains 2026', 'India newly listed IPO performance 2026'];

  const headlines: IpoHeadlineWithUrl[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    if (gnewsKey) {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&country=in&max=6&apikey=${gnewsKey}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        for (const a of data.articles || []) {
          const key = a.title?.toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          headlines.push({
            title: String(a.title || '').slice(0, 140),
            date: String(a.publishedAt || '').slice(0, 10),
            source: String(a.source?.name || 'GNews').slice(0, 40),
            url: String(a.url || ''),
          });
        }
      }
    }

    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const rssRes = await fetch(rssUrl, { cache: 'no-store' });
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xml)) !== null && headlines.length < 20) {
        const block = match[1];
        const title = block
          .match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]
          ?.trim();
        const link = block
          .match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]
          ?.trim();
        const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
        const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1]?.trim() || 'Google News';
        if (!title || seen.has(title.toLowerCase())) continue;
        seen.add(title.toLowerCase());
        headlines.push({
          title: title.slice(0, 140),
          date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          source: source.slice(0, 40),
          url: link || '',
        });
      }
    }
  }

  const symbolSet = new Set(symbols.map((s) => s.toLowerCase()));
  const prioritized = headlines.filter((h) => {
    const lower = h.title.toLowerCase();
    return [...symbolSet].some((sym) => lower.includes(sym.toLowerCase()));
  });

  return [...prioritized, ...headlines.filter((h) => !prioritized.includes(h))].slice(0, 12);
}

function attachHeadlines(records: IpoFactRecord[], headlines: IpoHeadlineWithUrl[]) {
  for (const record of records) {
    const nameTokens = record.name.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    const matched = headlines.filter((h) => {
      const lower = h.title.toLowerCase();
      return (
        lower.includes(record.symbol.toLowerCase()) ||
        nameTokens.some((token) => lower.includes(token))
      );
    });

    record.headlines = matched.slice(0, 3).map((h) => ({
      title: h.title,
      url: h.url || '',
      publisher: h.source,
      date: h.date,
    }));

    for (const h of record.headlines) {
      if (h.url) {
        record.sources.push({
          title: h.title,
          url: h.url,
          publisher: h.publisher,
          date: h.date,
        });
      }
    }
  }
}

export async function fetchIpoFactRecords(filter: 'upcoming' | 'recent'): Promise<IpoFactRecord[]> {
  const [currentRows, pastRows] = await Promise.all([
    nseFetch<NseCurrentRow[]>('/api/ipo-current-issue'),
    nseFetch<NsePastRow[]>('/api/public-past-issues'),
  ]);

  const bySymbol = new Map<string, IpoFactRecord>();

  const pastBySymbol = new Map<string, NsePastRow>();
  for (const row of pastRows || []) {
    if (row.symbol) pastBySymbol.set(String(row.symbol).toUpperCase(), row);
  }

  if (filter === 'upcoming') {
    for (const row of currentRows || []) {
      if (!row.symbol) continue;
      const sym = String(row.symbol).toUpperCase();
      const rec = mapCurrentRow(row, pastBySymbol.get(sym));
      bySymbol.set(rec.symbol, rec);
    }

    for (const row of pastRows || []) {
      if (!row.symbol) continue;
      if (row.listingDate && row.listingDate !== '-') continue;
      const rec = mapPastRow(row, 'upcoming');
      if (!bySymbol.has(rec.symbol)) bySymbol.set(rec.symbol, rec);
    }
  } else {
    for (const row of pastRows || []) {
      if (!row.symbol || !row.listingDate || row.listingDate === '-') continue;
      const listedOn = parseNseDate(row.listingDate);
      if (!listedOn || daysSince(listedOn) > 120) continue;
      bySymbol.set(row.symbol, mapPastRow(row, 'recent'));
    }
  }

  const records = [...bySymbol.values()].slice(0, 6);

  if (filter === 'recent') {
    await Promise.all(
      records.map(async (rec) => {
        const yahooSym = `${rec.symbol}.NS`;
        const current = await fetchYahooPrice(yahooSym);
        if (current != null) {
          rec.numbers.current_price = Math.round(current * 100) / 100;
          if (rec.numbers.issue_price) {
            rec.numbers.listing_gain_pct =
              Math.round(((current - rec.numbers.issue_price) / rec.numbers.issue_price) * 1000) / 10;
          }
          rec.facts = buildFacts(rec);
          rec.sentiment_backing = buildSentimentBacking(rec.numbers, rec.status);
          rec.sources.push({
            title: `${rec.symbol} live quote`,
            url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSym)}`,
            publisher: 'Yahoo Finance',
            date: new Date().toISOString().slice(0, 10),
          });
        }
      })
    );
  }

  const headlines = await fetchIpoHeadlinesWithUrls(
    filter,
    records.map((r) => r.symbol)
  );
  attachHeadlines(records, headlines);

  return records;
}

export function buildIpoGroqPayload(
  records: IpoFactRecord[],
  filter: string,
  category: string,
  budget: string
): string {
  const compact = records.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    status: r.status,
    security_type: r.security_type,
    issue_price: r.numbers.issue_price,
    price_range: [r.numbers.price_range_low, r.numbers.price_range_high],
    shares_offered: r.numbers.shares_offered,
    subscription_x: r.numbers.subscription_times,
    current_price: r.numbers.current_price,
    listing_gain_pct: r.numbers.listing_gain_pct,
    issue_start: r.numbers.issue_start,
    issue_end: r.numbers.issue_end,
    listing_date: r.numbers.listing_date,
    sentiment_backing: r.sentiment_backing,
    headlines: r.headlines.map((h) => h.title),
  }));

  return `filter:${filter}|category:${category}|budget:₹${budget}\nIPO_DATA:${JSON.stringify(compact)}`;
}

export function deriveSentimentFromRecord(record: IpoFactRecord): 'Bullish' | 'Bearish' | 'Neutral' {
  return deriveSentiment(record.sentiment_backing);
}
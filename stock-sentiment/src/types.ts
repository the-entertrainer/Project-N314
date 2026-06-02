// ─── Enums ───────────────────────────────────────────────────────────────────
export enum Sentiment  { Positive = 'Positive', Neutral = 'Neutral', Negative = 'Negative' }
export enum Recommendation { Buy = 'Buy', Sell = 'Sell', Hold = 'Hold' }
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type DataSourceStatus = 'idle' | 'fetching' | 'partial' | 'done' | 'failed';
export type TabId = 'dashboard' | 'screener' | 'deepdive' | 'fno' | 'news' | 'advisor';

// ─── Market Data ─────────────────────────────────────────────────────────────
export interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
}

export interface StockQuote {
  symbol: string;          // e.g. "INFY.NS"
  ticker: string;          // e.g. "INFY"
  name: string;
  sector: string;
  price: number;
  change: number;
  changePct: number;
  high52w: number;
  low52w: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;     // volume / avgVolume
  pe: number | null;
  pb: number | null;
  eps: number | null;
  divYield: number | null;
  beta: number | null;
  isFno: boolean;
  // computed
  rsi14?: number;
  ma50?: number;
  ma200?: number;
  score?: number;
  grade?: Grade;
  fnoFlag?: boolean;       // smart money accumulation signal
}

export interface HistoricalBar {
  date: string;            // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── F&O ─────────────────────────────────────────────────────────────────────
export interface FnoData {
  symbol: string;
  oi: number;
  oiChange: number;
  oiChangePct: number;
  lotSize: number;
  pcr: number;             // put-call ratio
  maxPain: number;
  iv: number | null;       // implied volatility %
}

// ─── FII / DII ───────────────────────────────────────────────────────────────
export interface FiiDiiFlow {
  date: string;
  fiiBuy: number;
  fiiSell: number;
  fiiNet: number;
  diiBuy: number;
  diiSell: number;
  diiNet: number;
}

// ─── News ────────────────────────────────────────────────────────────────────
export interface NewsArticle {
  title: string;
  snippet: string;
  uri: string;
  publishedAt: string;
  source: string;
  sentiment?: 'Bullish' | 'Bearish' | 'Neutral';
  relevantTickers?: string[];
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────
export interface ShortTermCall {
  action: Recommendation;
  entry: number;
  target: number;
  stopLoss: number;
  confidence: number;      // 0–100
  reasoning: string;
}

export interface StockAiAnalysis {
  symbol: string;
  shortTerm: ShortTermCall;
  longTerm: { thesis: string; timeframe: string };
  risks: string[];
  sentimentScore: number;  // -1 to 1
  keyLevels: { support: number; resistance: number };
  generatedAt: number;     // timestamp
}

export interface AdvisorOutput {
  shortPicks: Array<{ ticker: string; action: string; entry: number; target: number; sl: number; reasoning: string }>;
  longPicks: Array<{ ticker: string; thesis: string; timeframe: string }>;
  avoidList: Array<{ ticker: string; reason: string }>;
  niftyOutlook: { direction: 'up' | 'down' | 'sideways'; keyLevel: number; reasoning: string };
  generatedAt: number;
}

// ─── Data status ─────────────────────────────────────────────────────────────
export interface SourceStatus {
  status: DataSourceStatus;
  loaded?: number;
  total?: number;
  error?: string;
  lastUpdated?: number;
}

export interface AppDataStatus {
  universe:  SourceStatus;
  prices:    SourceStatus;
  indices:   SourceStatus;
  fiiDii:    SourceStatus;
  fno:       SourceStatus;
  news:      SourceStatus;
}

// ─── Screener filters ────────────────────────────────────────────────────────
export interface ScreenerFilters {
  search: string;
  sector: string;
  grade: string;
  fnoOnly: boolean;
  fnoFlagOnly: boolean;
  sortBy: keyof StockQuote;
  sortDir: 'asc' | 'desc';
}

// ─── Legacy (used by original geminiService) ─────────────────────────────────
export interface PointReason { point: string; reason: string }
export interface AspectSentiment {
  financials: number; product?: number; management: number; marketPosition: number;
  [key: string]: number | undefined;
}
export interface TechnicalIndicators { movingAverage50: number; movingAverage200: number; rsi14: number }
export interface HistoricalDataPoint {
  date: string; price: number | null; ma50?: number | null; ma200?: number | null;
  rsi14?: number | null; volume?: number | null; sentimentScore?: number | null;
}
export interface SentimentAnalysis {
  companyName: string; stockSymbol: string; overallSentiment: Sentiment;
  sentimentScore: number; summary: string; positivePoints: PointReason[];
  negativePoints: PointReason[]; currentPrice: number; fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number; currentVolume: number; averageVolume: number;
  currencySymbol: string; recommendation: Recommendation; recommendationSummary: string;
  newsArticles: NewsArticle[]; historicalData: HistoricalDataPoint[];
  technicalIndicators: TechnicalIndicators; dataSources: { title: string; uri: string }[];
  aspectSentiment: AspectSentiment;
}

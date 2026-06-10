import type { ChartSeriesPoint, TechnicalSnapshot } from '../lib/technicalAnalysis';
import type { NewsArticle } from '../lib/newsFetcher';
import type { HistoricalBar, StockQuote } from '../lib/marketData';

export interface NewsImpact {
  headline: string;
  source: string;
  impact_score: number;
  reasoning: string;
  time_horizon: 'short' | 'medium' | 'long';
}

export interface TechnicalSignal {
  indicator: string;
  value: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  weight: number;
}

export interface GroqAnalysis {
  verdict: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  price_target_7d: number;
  price_target_30d: number;
  current_sentiment: 'bullish' | 'bearish' | 'neutral';
  headline_summary: string;
  executive_summary: string;
  global_context: string;
  news_impacts: NewsImpact[];
  technical_signals: TechnicalSignal[];
  risk_factors: string[];
  catalysts: string[];
  error_margin_pct: number;
  reasoning_chain: string[];
}

export interface GlobalIndexSnapshot {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export interface AnalysisReport {
  symbol: string;
  quote: StockQuote;
  technicals: TechnicalSnapshot;
  chartSeries: ChartSeriesPoint[];
  history: HistoricalBar[];
  news: NewsArticle[];
  globalIndices: GlobalIndexSnapshot[];
  analysis: GroqAnalysis;
  generatedAt: string;
}
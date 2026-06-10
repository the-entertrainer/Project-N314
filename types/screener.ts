export interface Nifty500Stock {
  symbol: string;
  companyName: string;
  industry: string;
}

export interface ScreenerRow extends Nifty500Stock {
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
}

export interface SentimentResult {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  sentiment_score: number;
  predicted_trend: string;
  news_drivers: string[];
  news_scope: 'company' | 'sector' | 'macro';
}
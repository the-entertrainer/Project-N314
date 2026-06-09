export interface MarketQuote {
  symbol: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  currency?: string;
  exchange?: string;
}

export interface HistoricalDataPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface MarketResponse {
  success: boolean;
  data?: MarketQuote[] | HistoricalDataPoint[];
  error?: string;
}

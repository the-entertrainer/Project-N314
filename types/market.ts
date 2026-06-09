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

export interface MarketResponse {
  success: boolean;
  data?: MarketQuote[];
  error?: string;
}

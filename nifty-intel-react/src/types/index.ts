export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  isFno: boolean;
  institutionalFlag: boolean;

  cmp?: number;
  returnDaily?: number;
  high52w?: number;
  low52w?: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
  eps?: number;
  divYield?: number;
  beta?: number;
  volume?: number;
  avgVolume?: number;
  volumeVsAvg?: number;

  rsi?: number;
  macd?: number;
  macdSignal?: number;
  maStatus?: 'BULLISH' | 'BEARISH';
  trend?: string;
  support1?: number;
  support2?: number;
  resistance1?: number;
  resistance2?: number;
  atr?: number;
  historicalVol?: number;
  returnMonthly?: number;
  returnQuarterly?: number;
  return1y?: number;
  return5d?: number;

  roe?: number;
  debtEquity?: number;
  profitMargin?: number;
  revenueGrowth?: number;
  revenueFY24?: number;
  currentRatio?: number;
  quickRatio?: number;

  score?: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  rawPrices?: number[];
  rawDates?: string[];
  rationale?: Rationale;
}

export interface Rationale {
  recommendationBasis?: string;
  technicalSignals?: string[];
  fundamentalSignals?: string[];
  risks?: string[];
  aiNarrative?: string;
}

export interface FnoPosition {
  id: string;
  underlyingTicker: string;
  strikePrice: number;
  expiryDate: string;
  optionType: 'CE' | 'PE' | 'CALL' | 'PUT';
  position: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  currentPrice?: number;
  greeks?: {
    delta: number;
    gamma: number;
    vega: number;
    theta: number;
  };
}

export interface Strategy {
  id: string;
  name: string;
  type: 'IRON_CONDOR' | 'BULL_CALL' | 'BEAR_PUT' | 'STRADDLE';
  positions: FnoPosition[];
  maxProfit?: number;
  maxLoss?: number;
  breakevens?: [number, number];
  createdAt: number;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface HistoryData {
  prices: number[];
  dates: string[];
  volumes?: number[];
  highs?: number[];
  lows?: number[];
}

export interface NewsArticle {
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url: string;
  publishedAt: string;
  source: string;
}

export interface Quote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  averageVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap: number;
  trailingPE: number;
  priceToBook: number;
  trailingEps: number;
  trailingAnnualDividendYield?: number;
  beta: number;
}

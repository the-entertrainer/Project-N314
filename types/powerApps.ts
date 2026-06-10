export type PowerPanelId = 'nifty' | 'fiidii' | 'fno' | 'equity' | 'ipo' | 'dailyreport';

export interface AiBreakdown {
  plain_summary: string;
  logic_steps: string[];
  indicator_explanation: string;
}

export interface NiftyStrategyResult extends AiBreakdown {
  current_price: number;
  trend_slope: number;
  predicted_next_day: number;
  predicted_week: number;
  lookback_days: number;
  baseline_trend: string;
  strategies: { name: string; steps: string[]; why: string }[];
  outlook: string;
  risk_level: string;
}

export interface FiiDiiSession {
  date: string;
  fii_net_cr: number;
  dii_net_cr: number;
}

export interface FiiDiiResult extends AiBreakdown {
  fii_net_cr: number;
  dii_net_cr: number;
  fii_buy_cr: number;
  fii_sell_cr: number;
  dii_buy_cr: number;
  dii_sell_cr: number;
  date: string;
  sessions: FiiDiiSession[];
  institutional_sentiment: string;
  market_impact: string;
  accumulation_trend: string;
  analysis: string;
}

export interface FnoResult extends AiBreakdown {
  top_symbol: string;
  volume_share_pct: number;
  current_price: number;
  trend: string;
  sort_mode: string;
  strategy: string;
  instrument: string;
  risk_reward_ratio: string;
  entry_zone: string;
  stop_loss: string;
  target: string;
  trade_steps: string[];
}

export interface EquityDeepResult extends AiBreakdown {
  symbol: string;
  company_name: string;
  sector: string;
  timeline: string;
  buy_zone: string;
  target_price: string;
  risks: string[];
  catalysts: string[];
  sector_health: string;
  pe_ratio?: number;
  growth_trend: string;
  investment_plan: string[];
}

export type IpoAction =
  | 'Apply for Short-Term Listing Gains'
  | 'Accumulate for Long-Term Value'
  | 'Avoid Completely';

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

export interface IpoSourceLink {
  title: string;
  url: string;
  publisher: string;
  date: string;
}

export interface IpoSentimentBacking {
  metric: string;
  value: string;
  implication: string;
}

export interface IpoItem {
  symbol: string;
  name: string;
  status: 'upcoming' | 'recent' | 'active';
  security_type: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  numbers: IpoKeyNumbers;
  facts: IpoFactItem[];
  sources: IpoSourceLink[];
  sentiment_backing: IpoSentimentBacking[];
  pros: string[];
  cons: string[];
  action: IpoAction;
  rationale: string;
  summary: string;
}

export interface IpoResult extends AiBreakdown {
  ipos: IpoItem[];
  market_context: string;
  filter: string;
  category: string;
  budget: string;
  data_sources?: string[];
}
export type PowerPanelId = 'nifty' | 'fiidii' | 'fno' | 'equity' | 'ipo';

export interface NiftyStrategyResult {
  current_price: number;
  trend_slope: number;
  predicted_next_day: number;
  predicted_week: number;
  baseline_trend: string;
  strategies: string[];
  outlook: string;
  risk_level: string;
}

export interface FiiDiiResult {
  fii_net_cr: number;
  dii_net_cr: number;
  fii_buy_cr: number;
  fii_sell_cr: number;
  dii_buy_cr: number;
  dii_sell_cr: number;
  date: string;
  institutional_sentiment: string;
  market_impact: string;
  analysis: string;
}

export interface FnoResult {
  top_symbol: string;
  volume_share_pct: number;
  current_price: number;
  trend: string;
  strategy: string;
  instrument: string;
  risk_reward_ratio: string;
  entry_zone: string;
  stop_loss: string;
  target: string;
}

export interface EquityDeepResult {
  symbol: string;
  company_name: string;
  sector: string;
  buy_zone: string;
  target_price: string;
  risks: string[];
  catalysts: string[];
  sector_health: string;
  summary: string;
  pe_ratio?: number;
  growth_trend: string;
}

export interface IpoItem {
  name: string;
  recommendation: 'Long-Term Buy' | 'Apply for Short-Term Listing Gains' | 'Avoid';
  reasons: string[];
  summary: string;
}

export interface IpoResult {
  ipos: IpoItem[];
  market_context: string;
}
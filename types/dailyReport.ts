export interface ReportStockRow {
  rank: number;
  stock: string;
  symbol: string;
  sector: string;
  cmp: number | null;
  buy_zone: string;
  conviction_score: number;
  risk_score: number;
}

export interface DeepStockAnalysis {
  symbol: string;
  stock: string;
  sector: string;
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Avoid';
  conviction_score: number;
  business_overview: string;
  financial_highlights: string[];
  technical_view: string;
  valuation_view: string;
  risks: string[];
  bull_case: { probability: string; target: string };
  base_case: { probability: string; target: string };
  bear_case: { probability: string; target: string };
  investment_plan: {
    buy_zone: string;
    stop_loss: string;
    target_1y: string;
    target_3y: string;
    expected_cagr: string;
  };
  why_buy: string;
  key_risk: string;
}

export interface FnoOpportunity {
  symbol: string;
  trend: string;
  oi_change: string;
  strategy: string;
  entry: string;
  target_1: string;
  target_2: string;
  stop_loss: string;
  risk_reward: string;
  success_probability: number;
}

export interface NiftyStrategy {
  name: string;
  market_condition: string;
  entry_condition: string;
  max_profit: string;
  max_loss: string;
  probability: string;
  risk_reward: string;
  confidence: number;
}

export interface SectorReport {
  sector: string;
  rank: number;
  financial_strength: string;
  technical_strength: string;
  institutional_interest: string;
  growth_outlook: string;
}

export interface IpoReportItem {
  name: string;
  symbol: string;
  status: string;
  financial_strength: number;
  business_quality: number;
  valuation_score: number;
  recommendation: 'Strong Apply' | 'Apply' | 'Neutral' | 'Avoid';
  opportunity_type: string;
  summary: string;
}

export interface BestIdea {
  title: string;
  why: string;
  entry_or_buy_zone: string;
  target: string;
  stop_loss: string;
  conviction_or_probability: string;
}

export interface DailyReport {
  generated_at: string;
  report_date: string;
  data_sources: string[];
  confidence_score: number;
  executive_summary: {
    market_sentiment: string;
    nifty_outlook: string;
    bank_nifty_outlook: string;
    top_opportunities: string[];
    major_risks: string[];
    events_to_watch: string[];
    best_stock: string;
    best_fno_trade: string;
    best_nifty_strategy: string;
    best_sector: string;
    summary: string;
  };
  market_overview: {
    nifty_close: number | null;
    sensex_close: number | null;
    bank_nifty_close: number | null;
    india_vix: number | null;
    advance_decline: string;
    breadth_analysis: string;
    institutional_positioning: string;
    sector_rotation: string;
    global_impact: string;
    next_day: { bullish_pct: number; neutral_pct: number; bearish_pct: number };
    weekly_outlook: { range: string; targets: string; risks: string };
  };
  fii_dii_analysis: {
    cash_activity: string;
    futures_activity: string;
    options_activity: string;
    smart_money: string;
    accumulation_signals: string[];
    distribution_signals: string[];
    next_session_impact: string;
    fii_net_cr: number;
    dii_net_cr: number;
  };
  top_200: ReportStockRow[];
  top_25: DeepStockAnalysis[];
  fno_opportunities: FnoOpportunity[];
  nifty_strategies: NiftyStrategy[];
  sector_leadership: SectorReport[];
  best_sector_1m: string;
  best_sector_1y: string;
  best_sector_5y: string;
  ipo_research: IpoReportItem[];
  actionable_dashboard: {
    long_term_buys: string[];
    swing_trades: string[];
    positional_trades: string[];
    fno_trades: string[];
    option_buying: string[];
    option_selling: string[];
    high_risk_high_reward: string[];
    low_risk: string[];
  };
  best_ideas: {
    best_equity: BestIdea;
    best_swing: BestIdea;
    best_fno: BestIdea;
    best_nifty: BestIdea;
  };
  risk_disclaimer: string;
}
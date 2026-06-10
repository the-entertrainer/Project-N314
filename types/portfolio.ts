export interface PortfolioHoldingInput {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  changePercent?: number;
  companyName?: string;
  industry?: string;
}

export interface HoldingSnapshot {
  symbol: string;
  status: string;
  pnl_view: string;
}

export interface UpcomingEvent {
  event: string;
  date_or_timing: string;
  impact: 'positive' | 'negative' | 'neutral';
  affected_symbols: string[];
}

export interface PortfolioInsight {
  portfolio_summary: string;
  current_tracking: {
    overall_sentiment: 'Bullish' | 'Bearish' | 'Neutral';
    total_pnl_outlook: string;
    holdings_snapshot: HoldingSnapshot[];
  };
  predictions: {
    short_term_7d: string;
    medium_term_30d: string;
  };
  upcoming_events: UpcomingEvent[];
  daily_advice: string;
  risk_alerts: string[];
}
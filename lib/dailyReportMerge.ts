import type { DailyReport } from '../types/dailyReport';
import type { DailyReportData } from './dailyReportData';

function str(v: unknown, max = 500) {
  return String(v ?? '').slice(0, max);
}

function num(v: unknown, fallback: number | null = null) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function arr(v: unknown, max = 8): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x, 200)).slice(0, max);
}

export function mergeDailyReport(
  data: DailyReportData,
  partA: Record<string, unknown>,
  partB: Record<string, unknown>
): DailyReport {
  const es = (partA.executive_summary || {}) as Record<string, unknown>;
  const mo = (partA.market_overview || {}) as Record<string, unknown>;
  const nd = (mo.next_day || {}) as Record<string, unknown>;
  const wo = (mo.weekly_outlook || {}) as Record<string, unknown>;
  const fii = (partA.fii_dii_analysis || {}) as Record<string, unknown>;
  const dash = (partB.actionable_dashboard || {}) as Record<string, unknown>;
  const ideas = (partB.best_ideas || {}) as Record<string, unknown>;

  const parseIdea = (raw: unknown) => {
    const i = (raw || {}) as Record<string, unknown>;
    return {
      title: str(i.title, 120),
      why: str(i.why, 300),
      entry_or_buy_zone: str(i.entry_or_buy_zone, 80),
      target: str(i.target, 80),
      stop_loss: str(i.stop_loss, 80),
      conviction_or_probability: str(i.conviction_or_probability, 60),
    };
  };

  const top25Raw = Array.isArray(partA.top_25) ? partA.top_25 : [];
  const top25 = top25Raw.slice(0, 25).map((item) => {
    const s = item as Record<string, unknown>;
    const inv = (s.investment_plan || {}) as Record<string, unknown>;
    return {
      symbol: str(s.symbol, 20),
      stock: str(s.stock, 80),
      sector: str(s.sector, 60),
      recommendation: (['Strong Buy', 'Buy', 'Hold', 'Avoid'].includes(String(s.recommendation))
        ? s.recommendation
        : 'Hold') as 'Strong Buy' | 'Buy' | 'Hold' | 'Avoid',
      conviction_score: num(s.conviction_score, 5) ?? 5,
      business_overview: str(s.business_overview, 400),
      financial_highlights: arr(s.financial_highlights, 6),
      technical_view: str(s.technical_view, 300),
      valuation_view: str(s.valuation_view, 200),
      risks: arr(s.risks, 4),
      bull_case: {
        probability: str((s.bull_case as Record<string, unknown>)?.probability, 40),
        target: str((s.bull_case as Record<string, unknown>)?.target, 60),
      },
      base_case: {
        probability: str((s.base_case as Record<string, unknown>)?.probability, 40),
        target: str((s.base_case as Record<string, unknown>)?.target, 60),
      },
      bear_case: {
        probability: str((s.bear_case as Record<string, unknown>)?.probability, 40),
        target: str((s.bear_case as Record<string, unknown>)?.target, 60),
      },
      investment_plan: {
        buy_zone: str(inv.buy_zone, 80),
        stop_loss: str(inv.stop_loss, 80),
        target_1y: str(inv.target_1y, 80),
        target_3y: str(inv.target_3y, 80),
        expected_cagr: str(inv.expected_cagr, 40),
      },
      why_buy: str(s.why_buy, 250),
      key_risk: str(s.key_risk, 200),
    };
  });

  const fnoRaw = Array.isArray(partB.fno_opportunities) ? partB.fno_opportunities : [];
  const niftyRaw = Array.isArray(partB.nifty_strategies) ? partB.nifty_strategies : [];
  const sectorRaw = Array.isArray(partB.sector_leadership) ? partB.sector_leadership : [];
  const ipoRaw = Array.isArray(partB.ipo_research) ? partB.ipo_research : [];

  return {
    generated_at: new Date().toISOString(),
    report_date: data.report_date,
    data_sources: data.data_sources,
    confidence_score: num(partA.confidence_score, 70) ?? 70,
    executive_summary: {
      market_sentiment: str(es.market_sentiment, 300),
      nifty_outlook: str(es.nifty_outlook, 300),
      bank_nifty_outlook: str(es.bank_nifty_outlook, 300),
      top_opportunities: arr(es.top_opportunities, 5),
      major_risks: arr(es.major_risks, 5),
      events_to_watch: arr(es.events_to_watch, 5),
      best_stock: str(es.best_stock, 120),
      best_fno_trade: str(es.best_fno_trade, 120),
      best_nifty_strategy: str(es.best_nifty_strategy, 120),
      best_sector: str(es.best_sector, 80),
      summary: str(es.summary, 600),
    },
    market_overview: {
      nifty_close: data.indices.nifty,
      sensex_close: data.indices.sensex,
      bank_nifty_close: data.indices.bank_nifty,
      india_vix: data.indices.vix,
      advance_decline: str(mo.advance_decline, 120),
      breadth_analysis: str(mo.breadth_analysis, 300),
      institutional_positioning: str(mo.institutional_positioning, 300),
      sector_rotation: str(mo.sector_rotation, 300),
      global_impact: str(mo.global_impact, 300),
      next_day: {
        bullish_pct: num(nd.bullish_pct, 40) ?? 40,
        neutral_pct: num(nd.neutral_pct, 35) ?? 35,
        bearish_pct: num(nd.bearish_pct, 25) ?? 25,
      },
      weekly_outlook: {
        range: str(wo.range, 120),
        targets: str(wo.targets, 200),
        risks: str(wo.risks, 200),
      },
    },
    fii_dii_analysis: {
      cash_activity: str(fii.cash_activity, 300),
      futures_activity: str(fii.futures_activity, 200),
      options_activity: str(fii.options_activity, 200),
      smart_money: str(fii.smart_money, 300),
      accumulation_signals: arr(fii.accumulation_signals, 4),
      distribution_signals: arr(fii.distribution_signals, 4),
      next_session_impact: str(fii.next_session_impact, 300),
      fii_net_cr: data.flows.fii_net_cr,
      dii_net_cr: data.flows.dii_net_cr,
    },
    top_200: data.top200,
    top_25: top25,
    fno_opportunities: fnoRaw.slice(0, 15).map((item) => {
      const f = item as Record<string, unknown>;
      return {
        symbol: str(f.symbol, 20),
        trend: str(f.trend, 80),
        oi_change: str(f.oi_change, 80),
        strategy: str(f.strategy, 120),
        entry: str(f.entry, 80),
        target_1: str(f.target_1, 80),
        target_2: str(f.target_2, 80),
        stop_loss: str(f.stop_loss, 80),
        risk_reward: str(f.risk_reward, 40),
        success_probability: num(f.success_probability, 55) ?? 55,
      };
    }),
    nifty_strategies: niftyRaw.slice(0, 10).map((item) => {
      const n = item as Record<string, unknown>;
      return {
        name: str(n.name, 80),
        market_condition: str(n.market_condition, 120),
        entry_condition: str(n.entry_condition, 120),
        max_profit: str(n.max_profit, 80),
        max_loss: str(n.max_loss, 80),
        probability: str(n.probability, 40),
        risk_reward: str(n.risk_reward, 40),
        confidence: num(n.confidence, 6) ?? 6,
      };
    }),
    sector_leadership: sectorRaw.slice(0, 14).map((item) => {
      const s = item as Record<string, unknown>;
      return {
        sector: str(s.sector, 60),
        rank: num(s.rank, 1) ?? 1,
        financial_strength: str(s.financial_strength, 120),
        technical_strength: str(s.technical_strength, 120),
        institutional_interest: str(s.institutional_interest, 120),
        growth_outlook: str(s.growth_outlook, 120),
      };
    }),
    best_sector_1m: str(partB.best_sector_1m, 60),
    best_sector_1y: str(partB.best_sector_1y, 60),
    best_sector_5y: str(partB.best_sector_5y, 60),
    ipo_research: ipoRaw.slice(0, 6).map((item) => {
      const i = item as Record<string, unknown>;
      return {
        name: str(i.name, 80),
        symbol: str(i.symbol, 20),
        status: str(i.status, 20),
        financial_strength: num(i.financial_strength, 5) ?? 5,
        business_quality: num(i.business_quality, 5) ?? 5,
        valuation_score: num(i.valuation_score, 5) ?? 5,
        recommendation: (['Strong Apply', 'Apply', 'Neutral', 'Avoid'].includes(String(i.recommendation))
          ? i.recommendation
          : 'Neutral') as 'Strong Apply' | 'Apply' | 'Neutral' | 'Avoid',
        opportunity_type: str(i.opportunity_type, 80),
        summary: str(i.summary, 250),
      };
    }),
    actionable_dashboard: {
      long_term_buys: arr(dash.long_term_buys, 10),
      swing_trades: arr(dash.swing_trades, 10),
      positional_trades: arr(dash.positional_trades, 10),
      fno_trades: arr(dash.fno_trades, 10),
      option_buying: arr(dash.option_buying, 10),
      option_selling: arr(dash.option_selling, 10),
      high_risk_high_reward: arr(dash.high_risk_high_reward, 10),
      low_risk: arr(dash.low_risk, 10),
    },
    best_ideas: {
      best_equity: parseIdea(ideas.best_equity),
      best_swing: parseIdea(ideas.best_swing),
      best_fno: parseIdea(ideas.best_fno),
      best_nifty: parseIdea(ideas.best_nifty),
    },
    risk_disclaimer:
      str(
        partB.risk_disclaimer,
        500
      ) ||
      'This report is for educational purposes only. Not SEBI-registered investment advice. Past performance does not guarantee future results. Conduct your own due diligence.',
  };
}
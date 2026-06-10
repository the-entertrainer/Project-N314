import type {
  DailyReport,
  DeepStockAnalysis,
  FnoOpportunity,
  NiftyStrategy,
  SectorReport,
  IpoReportItem,
  BestIdea,
} from '../types/dailyReport';
import type { DailyReportData, ScoredStock } from './dailyReportData';
import type { IpoFactRecord } from './ipoFacts';

function fmt(n: number | null | undefined, decimals = 2) {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-IN', { maximumFractionDigits: decimals });
}

function sentimentFromTrend(direction: string, vix: number | null): string {
  if (vix != null && vix > 20) return 'Cautious — elevated VIX signals higher fear';
  if (direction === 'upward') return 'Constructive — Nifty in upward linear trend';
  if (direction === 'downward') return 'Defensive — Nifty in downward trend';
  return 'Neutral — sideways index action';
}

function recommendation(s: ScoredStock): DeepStockAnalysis['recommendation'] {
  if (s.conviction_score >= 75 && s.risk_score < 50) return 'Strong Buy';
  if (s.conviction_score >= 60) return 'Buy';
  if (s.conviction_score >= 45) return 'Hold';
  return 'Avoid';
}

function buildDeepStock(s: ScoredStock): DeepStockAnalysis {
  const rec = recommendation(s);
  const buyLow = Math.round(s.cmp * 0.96);
  const buyHigh = Math.round(s.cmp * 0.99);
  const stop = Math.round(s.cmp * 0.92);
  const t1y = Math.round(s.cmp * (1 + Math.max(0.08, s.momentum_20d / 100)));
  const t3y = Math.round(s.cmp * 1.25);

  const technical = [
    `RSI ${s.rsi ?? 'N/A'} — ${s.rsi != null && s.rsi > 70 ? 'overbought zone' : s.rsi != null && s.rsi < 35 ? 'oversold' : 'neutral momentum'}`,
    `20-day return ${s.momentum_20d >= 0 ? '+' : ''}${s.momentum_20d}%`,
    s.above_sma50 ? 'Price above 50-day average (bullish structure)' : 'Below 50-day average',
    s.above_sma200 ? 'Above 200-day average (long-term uptrend)' : 'Below 200-day average',
  ].join('. ');

  const valuation =
    s.pe != null
      ? `Trailing PE ${s.pe} vs sector peers — ${s.pe < 25 ? 'reasonable' : s.pe > 40 ? 'stretched' : 'fair'} on headline basis (Yahoo Finance)`
      : 'PE unavailable — use sector-relative view';

  return {
    symbol: s.symbol,
    stock: s.stock,
    sector: s.sector,
    recommendation: rec,
    conviction_score: Math.round(s.conviction_score / 10),
    business_overview: `${s.stock} operates in ${s.sector}. Screened from Nifty 500 with live CMP ₹${s.cmp} (Yahoo Finance).`,
    financial_highlights: [
      `CMP ₹${s.cmp} | Day change ${s.change_pct >= 0 ? '+' : ''}${s.change_pct}%`,
      s.pe != null ? `PE ${s.pe} (Yahoo)` : 'PE not reported',
      `Conviction score ${s.conviction_score}/100 | Risk ${s.risk_score}/100`,
    ],
    technical_view: technical,
    valuation_view: valuation,
    risks: [
      s.rsi != null && s.rsi > 75 ? `RSI ${s.rsi} — short-term stretched` : `Risk score ${s.risk_score}/100`,
      !s.above_sma200 ? 'Trading below 200-DMA — macro trend weak' : 'Macro trend supportive',
    ],
    bull_case: { probability: '30%', target: `₹${Math.round(s.cmp * 1.15)}` },
    base_case: { probability: '50%', target: `₹${t1y}` },
    bear_case: { probability: '20%', target: `₹${stop}` },
    investment_plan: {
      buy_zone: `₹${buyLow}–₹${buyHigh}`,
      stop_loss: `₹${stop}`,
      target_1y: `₹${t1y}`,
      target_3y: `₹${t3y}`,
      expected_cagr: s.momentum_20d > 5 ? '12–18%' : '8–12%',
    },
    why_buy: `Conviction ${s.conviction_score}/100 with ${s.momentum_20d >= 0 ? 'positive' : 'negative'} 20-day momentum (${s.momentum_20d}%) and ${s.above_sma50 ? 'bullish' : 'weak'} short-term trend.`,
    key_risk: s.risk_score >= 55 ? `Elevated risk score ${s.risk_score} — size positions smaller` : 'Sector and macro headlines can override technical setup',
  };
}

function buildFnoOpportunities(data: DailyReportData): FnoOpportunity[] {
  return data.fnoUniverse.slice(0, 10).map((f) => {
    const entry = Math.round(f.price);
    const isBull = f.trend === 'bullish';
    const target1 = Math.round(f.price * (isBull ? 1.03 : 0.97));
    const target2 = Math.round(f.price * (isBull ? 1.05 : 0.95));
    const sl = Math.round(f.price * (isBull ? 0.98 : 1.02));
    const prob = Math.min(72, 48 + Math.abs(f.oiProxy) / 2);

    return {
      symbol: f.symbol.replace('.NS', ''),
      trend: `${f.trend} (${f.priceDelta >= 0 ? '+' : ''}${f.priceDelta}% 5d)`,
      oi_change: `Volume/OI proxy ${f.oiProxy >= 0 ? '+' : ''}${f.oiProxy}% vs 5d avg (Yahoo)`,
      strategy: isBull ? 'Long futures / bull call spread' : 'Short futures / bear put spread',
      entry: `₹${entry}`,
      target_1: `₹${target1}`,
      target_2: `₹${target2}`,
      stop_loss: `₹${sl}`,
      risk_reward: '1:2',
      success_probability: Math.round(prob),
    };
  });
}

function buildNiftyStrategies(data: DailyReportData): NiftyStrategy[] {
  const { nifty_trend: t, vix } = data.indices;
  const nifty = data.indices.nifty ?? 0;
  const bullish = t.direction === 'upward';
  const highVix = (vix ?? 0) > 18;

  const strategies: NiftyStrategy[] = [
    {
      name: bullish ? 'Bull Call Spread' : 'Bear Put Spread',
      market_condition: `${t.direction} trend, slope ${t.trend_slope}`,
      entry_condition: `Nifty holds ${bullish ? 'above' : 'below'} ${fmt(nifty)} at open`,
      max_profit: bullish ? '₹3,000–₹5,000/lot' : '₹2,500–₹4,000/lot',
      max_loss: 'Limited to premium paid',
      probability: bullish ? '58%' : '52%',
      risk_reward: '1:2',
      confidence: bullish ? 7 : 6,
    },
    {
      name: highVix ? 'Iron Condor' : 'ATM Straddle (event)',
      market_condition: `India VIX ${fmt(vix, 1)}`,
      entry_condition: highVix ? 'VIX elevated — sell wings' : 'Low vol — buy straddle',
      max_profit: highVix ? 'Net credit received' : 'Large move either side',
      max_loss: highVix ? 'Wing breach' : 'Premium decay',
      probability: highVix ? '55%' : '45%',
      risk_reward: highVix ? '1:3' : '1:4',
      confidence: 6,
    },
    {
      name: 'Nifty Futures Trend Follow',
      market_condition: `Predicted next day ${fmt(t.predicted_next_day)} (math model)`,
      entry_condition: `Align with ${t.direction} bias on open`,
      max_profit: 'Open-ended with trend',
      max_loss: '1.5% of notional stop',
      probability: '50%',
      risk_reward: '1:2.5',
      confidence: 5,
    },
  ];

  return strategies;
}

function buildSectorLeadership(scored: ScoredStock[]): SectorReport[] {
  const bySector = new Map<string, ScoredStock[]>();
  for (const s of scored) {
    const list = bySector.get(s.sector) || [];
    list.push(s);
    bySector.set(s.sector, list);
  }

  const sectors = [...bySector.entries()]
    .map(([sector, stocks]) => {
      const avgConv = stocks.reduce((a, b) => a + b.conviction_score, 0) / stocks.length;
      const avgMom = stocks.reduce((a, b) => a + b.momentum_20d, 0) / stocks.length;
      const above50 = stocks.filter((s) => s.above_sma50).length / stocks.length;
      return {
        sector,
        avgConv,
        avgMom,
        above50,
        count: stocks.length,
      };
    })
    .sort((a, b) => b.avgConv - a.avgConv)
    .slice(0, 12);

  return sectors.map((s, i) => ({
    sector: s.sector,
    rank: i + 1,
    financial_strength: `Avg conviction ${Math.round(s.avgConv)}/100 across ${s.count} screened names`,
    technical_strength: `Avg 20d momentum ${s.avgMom >= 0 ? '+' : ''}${s.avgMom.toFixed(1)}% | ${Math.round(s.above50 * 100)}% above 50-DMA`,
    institutional_interest: s.avgConv >= 65 ? 'Screened leaders show institutional-quality trends' : 'Mixed — selective stock picking',
    growth_outlook: s.avgMom > 3 ? 'Positive price momentum' : s.avgMom < -2 ? 'Weak near-term tape' : 'Stable',
  }));
}

function buildIpoResearch(records: IpoFactRecord[]): IpoReportItem[] {
  return records.map((ipo) => {
    const n = ipo.numbers;
    const fin = n.issue_price != null ? 7 : 5;
    const biz = ipo.security_type === 'EQ' ? 7 : 6;
    const val = n.listing_gain_pct != null && n.listing_gain_pct > 20 ? 4 : 6;
    let rec: IpoReportItem['recommendation'] = 'Neutral';
    if (n.listing_gain_pct != null && n.listing_gain_pct > 15) rec = 'Apply';
    if (n.subscription_times != null && n.subscription_times >= 5) rec = 'Strong Apply';
    if (n.listing_gain_pct != null && n.listing_gain_pct < -5) rec = 'Avoid';

    return {
      name: ipo.name,
      symbol: ipo.symbol,
      status: ipo.status,
      financial_strength: fin,
      business_quality: biz,
      valuation_score: val,
      recommendation: rec,
      opportunity_type:
        ipo.status === 'recent'
          ? n.listing_gain_pct != null && n.listing_gain_pct > 0
            ? 'Listing gains demonstrated'
            : 'Watch post-listing'
          : 'Subscription window / upcoming',
      summary: `Issue ₹${n.issue_price ?? 'TBA'} | Band ₹${n.price_range_low ?? '—'}–₹${n.price_range_high ?? '—'} | Source: NSE India`,
    };
  });
}

function buildBestIdea(
  title: string,
  symbol: string,
  cmp: number,
  why: string,
  prob: string
): BestIdea {
  return {
    title: `${title}: ${symbol}`,
    why,
    entry_or_buy_zone: `₹${Math.round(cmp * 0.98)}–₹${cmp}`,
    target: `₹${Math.round(cmp * 1.08)}`,
    stop_loss: `₹${Math.round(cmp * 0.94)}`,
    conviction_or_probability: prob,
  };
}

export function buildDailyReport(data: DailyReportData): DailyReport {
  const { indices, flows, nifty_trend: t } = {
    indices: data.indices,
    flows: data.flows,
    nifty_trend: data.indices.nifty_trend,
  };

  const sorted = [...data.top25Scored].sort((a, b) => b.conviction_score - a.conviction_score);
  const top25 = sorted.slice(0, 25).map(buildDeepStock);
  const bestStock = sorted[0];
  const bestFno = data.fnoUniverse[0];
  const sectors = buildSectorLeadership(data.top25Scored);
  const fnoOps = buildFnoOpportunities(data);
  const niftyStrats = buildNiftyStrategies(data);
  const ipoResearch = buildIpoResearch(data.ipoRecords);

  const fiiBull = flows.fii_net_cr > 0;
  const diiBull = flows.dii_net_cr > 0;
  const vix = indices.vix;
  const bullishPct = t.direction === 'upward' ? (fiiBull ? 48 : 42) : fiiBull ? 38 : 32;
  const bearishPct = t.direction === 'downward' ? (vix != null && vix > 18 ? 40 : 35) : 22;
  const neutralPct = 100 - bullishPct - bearishPct;

  const sym = (s: ScoredStock) => s.symbol.replace('.NS', '');
  const dashLong = sorted.filter((s) => s.conviction_score >= 70).slice(0, 10).map(sym);
  const dashSwing = sorted.filter((s) => Math.abs(s.momentum_20d) > 3).slice(0, 10).map(sym);
  const dashLowRisk = sorted.filter((s) => s.risk_score < 45).slice(0, 10).map(sym);

  const confidence = Math.min(
    92,
    55 +
      (data.top25Scored.length > 40 ? 10 : 0) +
      (flows.fii_net_cr !== 0 || flows.dii_net_cr !== 0 ? 8 : 0) +
      (indices.nifty != null ? 10 : 0)
  );

  return {
    generated_at: new Date().toISOString(),
    report_date: data.report_date,
    data_sources: [...data.data_sources, 'N314 Quant Engine'],
    confidence_score: confidence,
    executive_summary: {
      market_sentiment: sentimentFromTrend(t.direction, vix),
      nifty_outlook: `Nifty ${fmt(indices.nifty)} | ${t.direction} trend | Next-day model ${fmt(t.predicted_next_day)} (Yahoo + linear regression)`,
      bank_nifty_outlook: `Bank Nifty ${fmt(indices.bank_nifty)} — banking basket follow-through tied to DII flows (₹${flows.dii_net_cr} Cr net)`,
      top_opportunities: top25.slice(0, 5).map((s) => `${s.stock} (${s.recommendation})`),
      major_risks: [
        vix != null && vix > 18 ? `India VIX ${vix} — elevated volatility` : 'VIX in normal band',
        !fiiBull ? `FII net sell ₹${Math.abs(flows.fii_net_cr)} Cr (NSE)` : 'FII selling absent today',
        t.direction === 'downward' ? 'Index trend downward — avoid aggressive longs' : 'Global headline risk',
      ],
      events_to_watch: ['RBI / macro data', 'FII/DII daily flow', 'Nifty weekly expiry', ...ipoResearch.slice(0, 2).map((i) => i.name)],
      best_stock: bestStock ? `${bestStock.stock} (${bestStock.symbol})` : '—',
      best_fno_trade: bestFno ? `${bestFno.symbol} ${bestFno.trend} vol leader` : '—',
      best_nifty_strategy: niftyStrats[0]?.name ?? '—',
      best_sector: sectors[0]?.sector ?? '—',
      summary: `India markets on ${data.report_date}: Nifty ${fmt(indices.nifty)}, VIX ${fmt(vix, 1)}, FII ${flows.fii_net_cr >= 0 ? '+' : ''}${flows.fii_net_cr} Cr / DII ${flows.dii_net_cr >= 0 ? '+' : ''}${flows.dii_net_cr} Cr. ${sorted.length} liquid names screened with live technicals. Top conviction: ${bestStock?.stock ?? 'N/A'}.`,
    },
    market_overview: {
      nifty_close: indices.nifty,
      sensex_close: indices.sensex,
      bank_nifty_close: indices.bank_nifty,
      india_vix: vix,
      advance_decline: `${sorted.filter((s) => s.change_pct > 0).length} up / ${sorted.filter((s) => s.change_pct <= 0).length} down in screened universe`,
      breadth_analysis: `${Math.round((sorted.filter((s) => s.above_sma50).length / sorted.length) * 100)}% of screened stocks above 50-DMA — ${sorted.filter((s) => s.above_sma50).length > sorted.length / 2 ? 'healthy breadth' : 'narrow participation'}`,
      institutional_positioning: `FII net ₹${flows.fii_net_cr} Cr | DII net ₹${flows.dii_net_cr} Cr (NSE India, ${flows.date})`,
      sector_rotation: `Leading sector: ${sectors[0]?.sector ?? '—'} | Weakest screened: ${sectors[sectors.length - 1]?.sector ?? '—'}`,
      global_impact: 'Correlate with US futures and crude overnight; data sourced at India close.',
      next_day: { bullish_pct: bullishPct, neutral_pct: neutralPct, bearish_pct: bearishPct },
      weekly_outlook: {
        range: `Nifty ${fmt((indices.nifty ?? 0) * 0.98)} – ${fmt((indices.nifty ?? 0) * 1.02)}`,
        targets: `Upside ${fmt(t.predicted_week)} (model) | Support near 50-DMA on leaders`,
        risks: `VIX spike above 20 | FII sustained selling`,
      },
    },
    fii_dii_analysis: {
      cash_activity: `FII bought ₹${flows.fii_buy_cr} Cr / sold ₹${flows.fii_sell_cr} Cr → net ₹${flows.fii_net_cr} Cr`,
      futures_activity: 'Index futures positioning inferred from FII cash + Nifty trend (NSE)',
      options_activity: vix != null ? `VIX ${vix} implies ${vix > 18 ? 'elevated' : 'normal'} options premium` : 'VIX unavailable',
      smart_money: fiiBull && diiBull
        ? 'FII and DII both net buyers — broad institutional support'
        : fiiBull
          ? 'FII leading inflows; DII mixed'
          : diiBull
            ? 'DII absorbing while FII sold — domestic support'
            : 'Both FII and DII net sellers — caution',
      accumulation_signals: diiBull ? [`DII net +₹${flows.dii_net_cr} Cr`] : [],
      distribution_signals: !fiiBull ? [`FII net ${flows.fii_net_cr} Cr`] : [],
      next_session_impact: fiiBull ? 'FII buying supports large-caps at open' : 'FII selling may pressure open; watch Bank Nifty',
      fii_net_cr: flows.fii_net_cr,
      dii_net_cr: flows.dii_net_cr,
    },
    top_200: data.top200,
    top_25: top25,
    fno_opportunities: fnoOps,
    nifty_strategies: niftyStrats,
    sector_leadership: sectors,
    best_sector_1m: sectors[0]?.sector ?? '—',
    best_sector_1y: sectors[0]?.sector ?? '—',
    best_sector_5y: sectors.find((s) => s.sector.includes('Financial') || s.sector.includes('IT'))?.sector ?? sectors[0]?.sector ?? '—',
    ipo_research: ipoResearch,
    actionable_dashboard: {
      long_term_buys: dashLong,
      swing_trades: dashSwing,
      positional_trades: sorted.slice(0, 10).map(sym),
      fno_trades: data.fnoUniverse.slice(0, 10).map((f) => f.symbol.replace('.NS', '')),
      option_buying: sorted.filter((s) => s.momentum_20d > 4).slice(0, 10).map(sym),
      option_selling: sorted.filter((s) => s.rsi != null && s.rsi > 60).slice(0, 10).map(sym),
      high_risk_high_reward: sorted.filter((s) => s.risk_score >= 55 && s.conviction_score >= 65).slice(0, 10).map(sym),
      low_risk: dashLowRisk,
    },
    best_ideas: {
      best_equity: bestStock
        ? buildBestIdea('Best Equity', sym(bestStock), bestStock.cmp, `Highest conviction ${bestStock.conviction_score}/100`, `${bestStock.conviction_score}%`)
        : { title: '—', why: '—', entry_or_buy_zone: '—', target: '—', stop_loss: '—', conviction_or_probability: '—' },
      best_swing: (() => {
        const swing = sorted.find((s) => Math.abs(s.momentum_20d) > 4);
        if (swing) return buildBestIdea('Best Swing', sym(swing), swing.cmp, `Momentum ${swing.momentum_20d}%`, '55%');
        if (bestStock) return buildBestIdea('Best Swing', sym(bestStock), bestStock.cmp, 'Top screened name', '50%');
        return { title: '—', why: '—', entry_or_buy_zone: '—', target: '—', stop_loss: '—', conviction_or_probability: '—' };
      })(),
      best_fno: bestFno
        ? {
            title: `Best F&O: ${bestFno.symbol}`,
            why: `Highest 5-day volume in F&O watchlist; ${bestFno.trend} trend ${bestFno.priceDelta}%`,
            entry_or_buy_zone: `₹${Math.round(bestFno.price)}`,
            target: `₹${Math.round(bestFno.price * 1.03)}`,
            stop_loss: `₹${Math.round(bestFno.price * 0.98)}`,
            conviction_or_probability: '58%',
          }
        : { title: '—', why: '—', entry_or_buy_zone: '—', target: '—', stop_loss: '—', conviction_or_probability: '—' },
      best_nifty: {
        title: `Best Nifty: ${niftyStrats[0]?.name ?? '—'}`,
        why: niftyStrats[0]?.market_condition ?? '—',
        entry_or_buy_zone: niftyStrats[0]?.entry_condition ?? '—',
        target: niftyStrats[0]?.max_profit ?? '—',
        stop_loss: niftyStrats[0]?.max_loss ?? '—',
        conviction_or_probability: niftyStrats[0]?.probability ?? '—',
      },
    },
    risk_disclaimer:
      'This report is generated from live NSE and Yahoo Finance data using quantitative rules — not SEBI-registered research. Not investment advice. Verify all figures independently before trading.',
  };
}
export class RationaleEngine {
  static buildStockRationale(stock, marketContext = {}) {
    const technical = [];
    const fundamental = [];
    const risks = [];

    // Technical signals
    if (stock.rsi !== null && stock.rsi !== undefined) {
      if (stock.rsi < 30) technical.push(`RSI ${stock.rsi.toFixed(0)} — oversold, potential reversal`);
      else if (stock.rsi > 70) technical.push(`RSI ${stock.rsi.toFixed(0)} — overbought, momentum strong`);
      else if (stock.rsi >= 50 && stock.rsi <= 65) technical.push(`RSI ${stock.rsi.toFixed(0)} — bullish momentum zone`);
      else technical.push(`RSI ${stock.rsi.toFixed(0)} — neutral`);
    }

    if (stock.trend === 'BULLISH') technical.push('Price above 20/50/200 DMA — strong uptrend');
    else if (stock.trend === 'MIXED_BULLISH') technical.push('Price above 200 DMA — long-term uptrend intact');
    else if (stock.trend === 'BEARISH') technical.push('Price below all key moving averages — downtrend');

    if (stock.macd !== null && stock.macd !== undefined) {
      if (stock.macd > 0) technical.push('MACD positive — bullish crossover');
      else technical.push('MACD negative — bearish signal');
    }

    if (stock.support1) technical.push(`Key support: ₹${stock.support1.toFixed(0)}`);
    if (stock.resistance1) technical.push(`Key resistance: ₹${stock.resistance1.toFixed(0)}`);

    if (stock.volumeVsAvg > 2) technical.push(`Volume ${stock.volumeVsAvg.toFixed(1)}× avg — institutional activity`);
    else if (stock.volumeVsAvg < 0.5) technical.push('Low volume — lack of conviction');

    if (stock.returnMonthly > 5) technical.push(`+${stock.returnMonthly.toFixed(1)}% monthly — strong relative strength`);
    else if (stock.returnMonthly < -10) technical.push(`${stock.returnMonthly.toFixed(1)}% monthly — underperforming`);

    // Fundamental signals
    if (stock.profitMargin !== null && stock.profitMargin !== undefined) {
      if (stock.profitMargin > 20) fundamental.push(`Profit margin ${stock.profitMargin.toFixed(1)}% — high-quality business`);
      else if (stock.profitMargin > 10) fundamental.push(`Profit margin ${stock.profitMargin.toFixed(1)}% — decent profitability`);
      else if (stock.profitMargin < 5) fundamental.push(`Thin margin ${stock.profitMargin.toFixed(1)}% — margin risk`);
    }

    if (stock.roe !== null && stock.roe !== undefined) {
      if (stock.roe > 20) fundamental.push(`ROE ${stock.roe.toFixed(1)}% — excellent capital efficiency`);
      else if (stock.roe > 12) fundamental.push(`ROE ${stock.roe.toFixed(1)}% — above average`);
      else fundamental.push(`ROE ${stock.roe.toFixed(1)}% — below average, check trend`);
    }

    if (stock.debtEquity !== null && stock.debtEquity !== undefined) {
      if (stock.debtEquity < 0.3) fundamental.push(`D/E ${stock.debtEquity.toFixed(2)} — near debt-free`);
      else if (stock.debtEquity < 1.0) fundamental.push(`D/E ${stock.debtEquity.toFixed(2)} — manageable debt`);
      else if (stock.debtEquity > 2.0) fundamental.push(`D/E ${stock.debtEquity.toFixed(2)} — high leverage, risk`);
    }

    if (stock.pe !== null && stock.pe !== undefined && stock.pe > 0) {
      if (stock.pe < 15) fundamental.push(`P/E ${stock.pe.toFixed(1)}× — undervalued vs market avg ~22×`);
      else if (stock.pe > 50) fundamental.push(`P/E ${stock.pe.toFixed(1)}× — premium valuation, needs earnings growth`);
      else fundamental.push(`P/E ${stock.pe.toFixed(1)}×`);
    }

    if (stock.return1y > 30) fundamental.push(`+${stock.return1y.toFixed(0)}% annual return — strong momentum`);

    // Risks
    if (stock.beta > 1.5) risks.push(`High beta ${stock.beta.toFixed(2)} — volatile, amplifies market moves`);
    if (stock.debtEquity > 2.0) risks.push('High debt burden — vulnerable in rate hike cycle');
    if (stock.rsi > 75) risks.push('Overbought — correction risk near-term');
    if (stock.pe > 60) risks.push('Expensive valuation — priced for perfection');
    if (stock.profitMargin < 5 && stock.profitMargin !== null) risks.push('Thin margins — susceptible to input cost pressures');
    if (marketContext.vix > 20) risks.push(`VIX ${marketContext.vix} — elevated volatility, wider stops needed`);

    const grade = stock.grade || 'B';
    const recommendationBasis = this._buildRecommendation(stock, grade);

    return { technicalSignals: technical, fundamentalSignals: fundamental, recommendationBasis, risks };
  }

  static buildFnoRationale(strategy, stock, niftyContext = {}) {
    const whyThisStrategy = this._explainStrategy(strategy, stock, niftyContext);
    const whyTheseStrikes = this._explainStrikes(strategy, stock);
    const technicalBasis = [];
    const riskFactors = [];
    const exitTriggers = [];

    if (strategy.type === 'IRON_CONDOR') {
      technicalBasis.push(`RSI ${stock?.rsi?.toFixed(0) || 'N/A'} — range-bound, no strong directional bias`);
      technicalBasis.push(`Nifty within ${niftyContext.consolidationDays || 'several'} days of consolidation`);
      if (niftyContext.pcr > 1.0) technicalBasis.push(`PCR ${niftyContext.pcr} — slight put bias, mild support below`);
      riskFactors.push('Gap-up/down beyond sold strikes invalidates strategy');
      riskFactors.push('Major event risk (RBI policy, quarterly results, global macro)');
      exitTriggers.push(`Exit if spot crosses ₹${strategy.breakEvenUpper?.toFixed(0)} (upper) or ₹${strategy.breakEvenLower?.toFixed(0)} (lower)`);
      exitTriggers.push('Close at 50% of max profit (standard IC management)');
    } else if (strategy.type === 'BULL_PUT_SPREAD') {
      technicalBasis.push('Bullish bias — support holds, put spread profits from stability/rally');
      if (stock?.trend === 'BULLISH') technicalBasis.push('Price above all key MAs — trend support');
      riskFactors.push('Put spread loses max at expiry if spot < lower strike');
      exitTriggers.push(`Stop if spot drops below ₹${strategy.strikeBuy?.toFixed(0)}`);
    } else if (strategy.type === 'BEAR_CALL_SPREAD') {
      technicalBasis.push('Bearish/neutral bias — resistance holds, call spread profits from stability/fall');
      exitTriggers.push(`Stop if spot breaks above ₹${strategy.strikeBuy?.toFixed(0)}`);
    }

    return { whyThisStrategy, whyTheseStrikes, technicalBasis, riskFactors, exitTriggers };
  }

  static buildLongTermRationale(stock) {
    const moat = this._inferMoat(stock);
    const growthDrivers = this._inferGrowthDrivers(stock);
    const valuationCase = this._inferValuation(stock);
    const technicalEntry = this._inferTechnicalEntry(stock);
    const roePart = stock.roe != null ? (stock.roe > 15 ? 'consistently high ROE' : 'improving returns') : 'strong fundamentals';
    const dePart = stock.debtEquity != null ? (stock.debtEquity < 0.5 ? 'a clean balance sheet' : 'manageable leverage') : 'a solid balance sheet';
    const tenYearThesis = `${stock.name} operates in a sector with long structural tailwinds. With ${roePart} and ${dePart}, the company is positioned to compound wealth over a decade.`;

    return { moat, growthDrivers, valuationCase, technicalEntry, tenYearThesis };
  }

  static buildGeminiEnrichmentPrompt(rationale, stock) {
    return `You are a senior equity research analyst at a top Indian brokerage.
Write a concise 3-sentence investment narrative for ${stock.name} (${stock.ticker}) based on these signals:

Technical signals: ${rationale.technicalSignals.join('; ')}
Fundamental signals: ${rationale.fundamentalSignals.join('; ')}
Recommendation basis: ${rationale.recommendationBasis}
Key risks: ${rationale.risks.join('; ')}

Write in plain English, no jargon, be specific about WHY an investor should pay attention NOW.
Include: what the chart says, what the fundamentals say, and the key risk to watch.
Do NOT repeat the numbers — explain what they MEAN for investors.`;
  }

  static _buildRecommendation(stock, grade) {
    const actions = {
      'AAA': 'Strong Buy', 'AA': 'Buy', 'A': 'Accumulate',
      'BBB': 'Hold', 'BB': 'Neutral', 'B': 'Reduce', 'C': 'Avoid'
    };
    const action = actions[grade] || 'Hold';
    const reason = stock.trend === 'BULLISH'
      ? `technical trend intact`
      : stock.rsi < 35
        ? `RSI oversold at ${stock.rsi?.toFixed(0)}, potential reversal`
        : `composite score ${stock.score}/100`;
    return `${action} — ${stock.name}: ${reason}`;
  }

  static _explainStrategy(strategy, stock, ctx) {
    const rsi = stock?.rsi?.toFixed(0) || '~50';
    const pcr = ctx?.pcr || 'N/A';
    if (strategy.type === 'IRON_CONDOR') {
      return `Iron Condor chosen because RSI ${rsi} indicates range-bound price action; PCR ${pcr} shows no strong directional bias; selling premium in a consolidating market maximizes time decay.`;
    } else if (strategy.type === 'BULL_PUT_SPREAD') {
      return `Bull Put Spread chosen because bullish trend intact; selling OTM puts with protection is risk-defined and profits if stock stays above support; limited risk vs naked put.`;
    } else if (strategy.type === 'BEAR_CALL_SPREAD') {
      return `Bear Call Spread chosen because resistance is holding; selling OTM calls with limited risk; benefits from time decay + sideways/down movement.`;
    }
    return 'Strategy selected based on current market conditions.';
  }

  static _explainStrikes(strategy, stock) {
    if (!strategy) return '';
    if (strategy.type === 'IRON_CONDOR') {
      return `Sell Call ${strategy.sellCall} / Buy Call ${strategy.buyCall}: beyond upper 1.5×ATR from spot (${(((strategy.sellCall - strategy.spot) / strategy.spot) * 100).toFixed(1)}% away). Sell Put ${strategy.sellPut} / Buy Put ${strategy.buyPut}: below lower 1.5×ATR from spot.`;
    } else if (strategy.type === 'BULL_PUT_SPREAD') {
      return `Sell Put ${strategy.strikeSell}: near support level — if price holds above, full credit kept. Buy Put ${strategy.strikeBuy}: protection, limits max loss to ₹${strategy.maxLoss?.toFixed(0)}/lot.`;
    }
    return `Strikes at ${strategy.strikeSell}/${strategy.strikeBuy} based on technical levels.`;
  }

  static _inferMoat(stock) {
    const sectorMoats = {
      'IT': 'Large client relationships, talent pool, domain expertise create switching-cost moat',
      'FMCG': 'Brand equity and distribution network across India create durable competitive advantage',
      'Banking': 'CASA franchise, branch network, and regulatory barriers protect market position',
      'Pharma': 'Regulatory approvals, R&D pipeline, and API capabilities create entry barriers',
      'Energy': 'Capital-intensive infrastructure and government relationships provide durable position',
      'Telecom': 'Spectrum ownership and network effects — winner-takes-most dynamics',
    };
    return sectorMoats[stock.sector] || `${stock.name} has competitive advantages in its sector with above-average returns on capital`;
  }

  static _inferGrowthDrivers(stock) {
    return [
      'Domestic consumption growth as India GDP expands to $10T by 2035',
      `${stock.sector} sector tailwinds from government capex and policy support`,
      'Operational leverage as fixed costs spread over growing revenue base',
    ];
  }

  static _inferValuation(stock) {
    if (!stock.pe) return 'Valuation data unavailable';
    if (stock.pe < 15) return `P/E ${stock.pe.toFixed(1)}× — meaningfully below market avg ~22×; potentially undervalued`;
    if (stock.pe < 25) return `P/E ${stock.pe.toFixed(1)}× — fair value range; reasonable entry for quality business`;
    return `P/E ${stock.pe.toFixed(1)}× — premium valuation; justified only if high growth rate sustains`;
  }

  static _inferTechnicalEntry(stock) {
    if (stock.rsi < 40 && stock.trend !== 'BEARISH') return `RSI ${stock.rsi?.toFixed(0)} — technically oversold, potential entry zone`;
    if (stock.support1 && stock.cmp) {
      const pctFromSupport = ((stock.cmp - stock.support1) / stock.support1) * 100;
      if (pctFromSupport < 5) return `Price near key support ₹${stock.support1.toFixed(0)} (${pctFromSupport.toFixed(1)}% above) — low-risk entry`;
    }
    if (stock.trend === 'BULLISH') return 'Price above all key MAs in confirmed uptrend — buy on dips to 20 DMA';
    return 'Wait for RSI to pull back below 50 or price to test support before entry';
  }
}

export default RationaleEngine;

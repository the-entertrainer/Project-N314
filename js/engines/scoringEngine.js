export class ScoringEngine {
  static scoreAll(stocks) {
    const results = new Map();
    for (const [ticker, stock] of stocks) {
      const { score, grade, breakdown } = this._scoreOne(stock);
      results.set(ticker, { score, grade, breakdown });
    }
    return results;
  }

  static _scoreOne(stock) {
    const breakdown = {};
    let total = 0;

    // Profit Margin — 30%
    const pm = stock.profitMargin || 0;
    const pmScore = Math.min(100, Math.max(0, pm > 0 ? Math.min(pm / 25, 1) * 100 : 0));
    breakdown.profitMargin = { score: pmScore, weight: 0.30, value: pm };
    total += pmScore * 0.30;

    // Momentum (RSI + MA trend) — 20%
    const rsi = stock.rsi || 50;
    let rsiScore = 0;
    if (rsi >= 50 && rsi <= 70) rsiScore = 100;
    else if (rsi >= 40 && rsi < 50) rsiScore = 65;
    else if (rsi > 70 && rsi <= 80) rsiScore = 50;
    else if (rsi < 40 && rsi >= 30) rsiScore = 40;
    else if (rsi > 80) rsiScore = 20;
    else rsiScore = 20;
    const trendBonus = stock.trend === 'BULLISH' ? 15 : stock.trend === 'MIXED_BULLISH' ? 8 : 0;
    const momScore = Math.min(100, rsiScore + trendBonus);
    breakdown.momentum = { score: momScore, weight: 0.20, value: rsi };
    total += momScore * 0.20;

    // Monthly Return — 15%
    const monthRet = stock.returnMonthly || 0;
    const mrScore = Math.min(100, Math.max(0, (monthRet + 10) / 20 * 100));
    breakdown.monthlyReturn = { score: mrScore, weight: 0.15, value: monthRet };
    total += mrScore * 0.15;

    // Annual Return — 10%
    const annRet = stock.return1y || 0;
    const arScore = Math.min(100, Math.max(0, (annRet + 30) / 80 * 100));
    breakdown.annualReturn = { score: arScore, weight: 0.10, value: annRet };
    total += arScore * 0.10;

    // ROE Quality — 10%
    const roe = stock.roe || 0;
    const roeScore = Math.min(100, Math.max(0, roe > 0 ? Math.min(roe / 30, 1) * 100 : 0));
    breakdown.roe = { score: roeScore, weight: 0.10, value: roe };
    total += roeScore * 0.10;

    // Debt/Equity — 5%
    const de = stock.debtEquity;
    let deScore = 80;
    if (de === null || de === undefined) deScore = 50;
    else if (de < 0.3) deScore = 100;
    else if (de < 0.7) deScore = 85;
    else if (de < 1.5) deScore = 60;
    else if (de < 3.0) deScore = 35;
    else deScore = 15;
    breakdown.debtEquity = { score: deScore, weight: 0.05, value: de };
    total += deScore * 0.05;

    // Revenue Growth — 5%
    const revGrowth = stock.revenueGrowth || 0;
    const rgScore = Math.min(100, Math.max(0, (revGrowth + 10) / 40 * 100));
    breakdown.revenueGrowth = { score: rgScore, weight: 0.05, value: revGrowth };
    total += rgScore * 0.05;

    // Volume Activity — 5%
    const volRatio = stock.volumeVsAvg || 1;
    const vScore = Math.min(100, Math.max(0, Math.min(volRatio / 3, 1) * 100));
    breakdown.volume = { score: vScore, weight: 0.05, value: volRatio };
    total += vScore * 0.05;

    const score = Math.round(Math.min(100, Math.max(0, total)));
    const grade = this._getGrade(score);
    const institutionalFlag = this._checkInstitutional(stock);

    return { score, grade, breakdown, institutionalFlag };
  }

  static _getGrade(score) {
    if (score >= 85) return 'AAA';
    if (score >= 75) return 'AA';
    if (score >= 65) return 'A';
    if (score >= 55) return 'BBB';
    if (score >= 45) return 'BB';
    if (score >= 35) return 'B';
    return 'C';
  }

  static _checkInstitutional(stock) {
    if (!stock.isFno) return false;
    const beta = stock.beta;
    const volRatio = stock.volumeVsAvg;
    const rsi = stock.rsi;
    const pm = stock.profitMargin;
    const dayChange5 = stock.return5d;

    return (
      beta !== null && beta < 1.5 &&
      volRatio !== null && volRatio > 1.5 &&
      rsi !== null && rsi >= 40 && rsi <= 60 &&
      pm !== null && pm > 15 &&
      dayChange5 !== null && Math.abs(dayChange5) < 3
    );
  }

  static applyScoresToState(stocks, scoreMap) {
    for (const [ticker, data] of scoreMap) {
      const stock = stocks.get(ticker);
      if (stock) {
        stock.score = data.score;
        stock.grade = data.grade;
        stock.scoreBreakdown = data.breakdown;
        stock.institutionalFlag = data.institutionalFlag;
      }
    }
  }
}

export default ScoringEngine;

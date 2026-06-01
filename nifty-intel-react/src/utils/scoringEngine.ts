import type { Stock } from '@/types';

export class ScoringEngine {
  static scoreAll(stocks: Map<string, Stock>): Map<string, number> {
    const scoreMap = new Map<string, number>();

    for (const stock of stocks.values()) {
      const score = this._scoreStock(stock);
      scoreMap.set(stock.ticker, score);
    }

    return scoreMap;
  }

  static applyScoresToState(
    stocks: Map<string, Stock>,
    scoreMap: Map<string, number>
  ): void {
    for (const [ticker, score] of scoreMap) {
      const stock = stocks.get(ticker);
      if (stock) {
        stock.score = score;
        stock.grade = this._getGrade(score);
      }
    }
  }

  private static _scoreStock(stock: Stock): number {
    let score = 0;

    if (stock.pe && stock.pe > 0 && stock.pe < 100)
      score += Math.max(0, 20 - stock.pe / 5);

    if (stock.roe && stock.roe > 0) score += Math.min(stock.roe / 2, 15);

    if (stock.debtEquity !== undefined && stock.debtEquity >= 0)
      score += Math.max(0, 10 - stock.debtEquity * 5);

    if (stock.pb && stock.pb > 0 && stock.pb < 10)
      score += Math.max(0, 5 - stock.pb);

    if (
      stock.rsi &&
      stock.rsi > 30 &&
      stock.rsi < 70
    )
      score += 5;
    else if (stock.rsi && stock.rsi > 50 && stock.rsi < 70) score += 7;

    if (stock.maStatus === 'BULLISH') score += 8;

    if (stock.trend === 'UPTREND') score += 5;

    if (stock.returnMonthly && stock.returnMonthly > 5) score += 5;

    if (stock.volumeVsAvg && stock.volumeVsAvg > 1.5) score += 3;

    if (stock.support1 && stock.cmp && stock.cmp > stock.support1)
      score += 3;

    return Math.min(Math.round(score), 100);
  }

  private static _getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'F';
  }
}

export default ScoringEngine;

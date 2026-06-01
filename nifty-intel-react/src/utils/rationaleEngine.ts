import type { Stock, Rationale } from '@/types';

export class RationaleEngine {
  static buildStockRationale(stock: Stock): Rationale {
    const signals: string[] = [];
    const risks: string[] = [];

    if (stock.rsi) {
      if (stock.rsi < 30) signals.push('Oversold condition (RSI < 30)');
      else if (stock.rsi > 70) signals.push('Overbought condition (RSI > 70)');
      else if (stock.rsi > 50 && stock.rsi < 70)
        signals.push('Strength building (RSI 50-70)');
    }

    if (stock.maStatus === 'BULLISH') {
      signals.push('MACD crossover bullish');
    } else if (stock.maStatus === 'BEARISH') {
      risks.push('MACD showing bearish divergence');
    }

    if (stock.trend === 'UPTREND') {
      signals.push('Price above 20/50/200 SMAs');
    } else if (stock.trend === 'DOWNTREND') {
      risks.push('Price below key moving averages');
    }

    if (stock.support1 && stock.cmp) {
      if (stock.cmp - stock.support1 < (stock.cmp * 0.05)) {
        risks.push(
          `Close to support1 (₹${stock.support1?.toFixed(2) || 'N/A'})`
        );
      }
    }

    if (stock.resistance1 && stock.cmp) {
      if (stock.resistance1 - stock.cmp < (stock.cmp * 0.05)) {
        signals.push(
          `Approaching resistance1 (₹${stock.resistance1?.toFixed(2) || 'N/A'})`
        );
      }
    }

    if (stock.volumeVsAvg && stock.volumeVsAvg > 1.5) {
      signals.push('Volume surge detected');
    }

    if (stock.pe && stock.pe < 15) {
      signals.push('Attractive valuation (P/E < 15)');
    } else if (stock.pe && stock.pe > 50) {
      risks.push('Expensive valuation (P/E > 50)');
    }

    if (stock.roe && stock.roe > 15) {
      signals.push(`Strong ROE (${stock.roe.toFixed(1)}%)`);
    } else if (stock.roe && stock.roe < 5) {
      risks.push(`Weak ROE (${stock.roe.toFixed(1)}%)`);
    }

    if (stock.debtEquity !== undefined) {
      if (stock.debtEquity < 0.5) {
        signals.push('Conservative leverage');
      } else if (stock.debtEquity > 1.5) {
        risks.push('High leverage');
      }
    }

    if (stock.profitMargin && stock.profitMargin > 15) {
      signals.push(`Healthy margins (${stock.profitMargin.toFixed(1)}%)`);
    }

    return {
      recommendationBasis: this._buildBasis(stock),
      technicalSignals: signals.length > 0 ? signals : undefined,
      fundamentalSignals: this._buildFundamentalSignals(stock),
      risks: risks.length > 0 ? risks : undefined,
    };
  }

  static buildLongTermRationale(stock: Stock): Rationale {
    const signals: string[] = [];

    if (stock.roe && stock.roe > 15) {
      signals.push(`Strong ROE at ${stock.roe.toFixed(1)}%`);
    }

    if (stock.debtEquity !== undefined && stock.debtEquity < 1) {
      signals.push(`Conservative D/E at ${stock.debtEquity.toFixed(2)}`);
    }

    if (stock.profitMargin && stock.profitMargin > 10) {
      signals.push(`Solid margins at ${stock.profitMargin.toFixed(1)}%`);
    }

    if (stock.pe && stock.pe < 20) {
      signals.push(`Fair valuation at P/E ${stock.pe.toFixed(1)}`);
    }

    return {
      recommendationBasis: `${stock.name} meets long-term criteria with strong fundamentals`,
      fundamentalSignals: signals.length > 0 ? signals : undefined,
    };
  }

  private static _buildBasis(stock: Stock): string {
    if (!stock.score || stock.score < 40) return '';

    let basis = '';
    if (stock.trend === 'UPTREND' && stock.rsi && stock.rsi < 70) {
      basis =
        `Technical setup favorable: ${stock.trend.toLowerCase()} with room to run`;
    } else if (stock.pe && stock.pe < 20 && stock.roe && stock.roe > 15) {
      basis = `Fundamental story solid: cheap valuation + strong returns`;
    } else if (stock.maStatus === 'BULLISH' && stock.volumeVsAvg && stock.volumeVsAvg > 1.2) {
      basis = `Momentum building: bullish MACD with volume confirmation`;
    } else {
      basis = `Score of ${stock.score}/100 suggests moderate opportunity`;
    }

    return basis;
  }

  private static _buildFundamentalSignals(stock: Stock): string[] | undefined {
    const signals: string[] = [];

    if (stock.pe && stock.pe > 0) signals.push(`P/E: ${stock.pe.toFixed(1)}`);
    if (stock.roe && stock.roe > 0)
      signals.push(`ROE: ${stock.roe.toFixed(1)}%`);
    if (stock.debtEquity !== undefined)
      signals.push(`D/E: ${stock.debtEquity.toFixed(2)}`);
    if (stock.profitMargin && stock.profitMargin > 0)
      signals.push(`Margin: ${stock.profitMargin.toFixed(1)}%`);

    return signals.length > 0 ? signals : undefined;
  }
}

export default RationaleEngine;

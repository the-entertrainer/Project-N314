import MathEngine from './mathEngine.ts';

export interface IronCondorLegs {
  longCall: { strike: number; premium: number };
  shortCall: { strike: number; premium: number };
  shortPut: { strike: number; premium: number };
  longPut: { strike: number; premium: number };
}

export interface IronCondorMetrics {
  maxProfit: number;
  maxLoss: number;
  breakEvenHigh: number;
  breakEvenLow: number;
  profitWidth: number;
  legs: IronCondorLegs;
}

export class FnoEngine {
  static calculateBlackScholesCall(
    S: number,
    K: number,
    T: number,
    r: number,
    sigma: number
  ): number {
    if (T <= 0 || sigma <= 0) return Math.max(S - K, 0);

    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const Nd1 = this._normCDF(d1);
    const Nd2 = this._normCDF(d2);

    const call = S * Nd1 - K * Math.exp(-r * T) * Nd2;
    return Math.max(call, 0);
  }

  static calculateBlackScholesPut(
    S: number,
    K: number,
    T: number,
    r: number,
    sigma: number
  ): number {
    if (T <= 0 || sigma <= 0) return Math.max(K - S, 0);

    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const Nd1 = this._normCDF(d1);
    const Nd2 = this._normCDF(d2);

    const put =
      K * Math.exp(-r * T) * (1 - Nd2) - S * (1 - Nd1);
    return Math.max(put, 0);
  }

  static calculateGreeks(
    S: number,
    K: number,
    T: number,
    r: number,
    sigma: number,
    optionType: 'call' | 'put'
  ) {
    if (T <= 0 || sigma <= 0) {
      return {
        delta: optionType === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
        gamma: 0,
        vega: 0,
        theta: 0,
      };
    }

    const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const Nd1 = this._normCDF(d1);
    const nd1 = this._normPDF(d1);

    const delta =
      optionType === 'call'
        ? Nd1
        : Nd1 - 1;

    const gamma = nd1 / (S * sigma * Math.sqrt(T));

    const vega = (S * nd1 * Math.sqrt(T)) / 100;

    const theta =
      optionType === 'call'
        ? (-S * nd1 * sigma) / (2 * Math.sqrt(T)) -
          r * K * Math.exp(-r * T) * this._normCDF(d2)
        : (-S * nd1 * sigma) / (2 * Math.sqrt(T)) +
          r * K * Math.exp(-r * T) * this._normCDF(-d2);

    return {
      delta: parseFloat(delta.toFixed(4)),
      gamma: parseFloat(gamma.toFixed(4)),
      vega: parseFloat(vega.toFixed(4)),
      theta: parseFloat(theta.toFixed(4)),
    };
  }

  static buildIronCondor(
    spotPrice: number,
    impliedVol: number,
    daysToExpiry: number,
    atmStrike: number
  ): IronCondorMetrics {
    const T = daysToExpiry / 365;
    const r = 0.05;

    const width = Math.round(atmStrike * 0.02); // 2% OTM width

    const longCallStrike = atmStrike + 2 * width;
    const shortCallStrike = atmStrike + width;
    const shortPutStrike = atmStrike - width;
    const longPutStrike = atmStrike - 2 * width;

    const longCallPrem = this.calculateBlackScholesCall(
      spotPrice,
      longCallStrike,
      T,
      r,
      impliedVol
    );

    const shortCallPrem = this.calculateBlackScholesCall(
      spotPrice,
      shortCallStrike,
      T,
      r,
      impliedVol
    );

    const shortPutPrem = this.calculateBlackScholesPut(
      spotPrice,
      shortPutStrike,
      T,
      r,
      impliedVol
    );

    const longPutPrem = this.calculateBlackScholesPut(
      spotPrice,
      longPutStrike,
      T,
      r,
      impliedVol
    );

    const totalCredit =
      shortCallPrem + shortPutPrem - longCallPrem - longPutPrem;

    if (totalCredit <= 0) {
      throw new Error(
        'Invalid strikes: total credit is non-positive'
      );
    }

    const maxProfit = totalCredit;
    const maxLoss = 2 * width - totalCredit;

    return {
      maxProfit,
      maxLoss,
      breakEvenHigh: shortCallStrike + totalCredit,
      breakEvenLow: shortPutStrike - totalCredit,
      profitWidth: shortCallStrike - shortPutStrike,
      legs: {
        longCall: { strike: longCallStrike, premium: longCallPrem },
        shortCall: { strike: shortCallStrike, premium: shortCallPrem },
        shortPut: { strike: shortPutStrike, premium: shortPutPrem },
        longPut: { strike: longPutStrike, premium: longPutPrem },
      },
    };
  }

  private static _normCDF(x: number): number {
    return 0.5 * (1 + this._erf(x / Math.sqrt(2)));
  }

  private static _normPDF(x: number): number {
    return Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
  }

  private static _erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1 / (1 + p * x);
    const y =
      1 -
      (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t *
        Math.exp(-x * x));

    return sign * y;
  }
}

export default FnoEngine;

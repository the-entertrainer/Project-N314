export class FnoEngine {
  static buildIronCondor(spot, expiry, historicalVol = 0.15) {
    const daysToExpiry = this._daysUntil(expiry);
    const atr = spot * historicalVol * Math.sqrt(daysToExpiry / 252);
    const sellCallStrike = this._roundToStrike(spot + atr * 1.5);
    const buyCallStrike = this._roundToStrike(spot + atr * 2.0);
    const sellPutStrike = this._roundToStrike(spot - atr * 1.5);
    const buyPutStrike = this._roundToStrike(spot - atr * 2.0);

    const callCredit = this._estimatePremium(spot, sellCallStrike, daysToExpiry, historicalVol, 'call') -
      this._estimatePremium(spot, buyCallStrike, daysToExpiry, historicalVol, 'call');
    const putCredit = this._estimatePremium(spot, sellPutStrike, daysToExpiry, historicalVol, 'put') -
      this._estimatePremium(spot, buyPutStrike, daysToExpiry, historicalVol, 'put');
    const totalCredit = callCredit + putCredit;
    if (totalCredit <= 0) return null;
    const wingWidth = buyCallStrike - sellCallStrike;
    const maxLoss = wingWidth - totalCredit;

    return {
      type: 'IRON_CONDOR',
      spot,
      sellCall: sellCallStrike,
      buyCall: buyCallStrike,
      sellPut: sellPutStrike,
      buyPut: buyPutStrike,
      credit: totalCredit,
      maxProfit: totalCredit,
      maxLoss,
      breakEvenUpper: sellCallStrike + totalCredit,
      breakEvenLower: sellPutStrike - totalCredit,
      winRate: this.estimateWinRate(spot, atr * 1.5, daysToExpiry, historicalVol),
      daysToExpiry,
    };
  }

  static buildBullPutSpread(spot, strikeSell, strikeBuy, expiry, historicalVol = 0.15) {
    const daysToExpiry = this._daysUntil(expiry);
    const sellPrem = this._estimatePremium(spot, strikeSell, daysToExpiry, historicalVol, 'put');
    const buyPrem = this._estimatePremium(spot, strikeBuy, daysToExpiry, historicalVol, 'put');
    const credit = sellPrem - buyPrem;
    const maxLoss = (strikeSell - strikeBuy) - credit;

    return {
      type: 'BULL_PUT_SPREAD',
      spot,
      strikeSell,
      strikeBuy,
      credit,
      maxProfit: credit,
      maxLoss,
      breakEven: strikeSell - credit,
      winRate: this.estimateWinRate(spot, spot - strikeSell, daysToExpiry, historicalVol),
      daysToExpiry,
    };
  }

  static buildBearCallSpread(spot, strikeSell, strikeBuy, expiry, historicalVol = 0.15) {
    const daysToExpiry = this._daysUntil(expiry);
    const sellPrem = this._estimatePremium(spot, strikeSell, daysToExpiry, historicalVol, 'call');
    const buyPrem = this._estimatePremium(spot, strikeBuy, daysToExpiry, historicalVol, 'call');
    const credit = sellPrem - buyPrem;
    const maxLoss = (strikeBuy - strikeSell) - credit;

    return {
      type: 'BEAR_CALL_SPREAD',
      spot,
      strikeSell,
      strikeBuy,
      credit,
      maxProfit: credit,
      maxLoss,
      breakEven: strikeSell + credit,
      winRate: this.estimateWinRate(spot, strikeSell - spot, daysToExpiry, historicalVol),
      daysToExpiry,
    };
  }

  static calculateGreeks(spot, strike, expiryDays, impliedVol, riskFreeRate = 0.065) {
    const T = expiryDays / 365;
    if (T <= 0 || impliedVol <= 0) return { delta: 0, gamma: 0, theta: 0, vega: 0 };
    const d1 = (Math.log(spot / strike) + (riskFreeRate + 0.5 * impliedVol ** 2) * T) /
      (impliedVol * Math.sqrt(T));
    const d2 = d1 - impliedVol * Math.sqrt(T);
    const delta = this._normalCDF(d1);
    const gamma = this._normalPDF(d1) / (spot * impliedVol * Math.sqrt(T));
    const theta = -(spot * this._normalPDF(d1) * impliedVol) / (2 * Math.sqrt(T)) -
      riskFreeRate * strike * Math.exp(-riskFreeRate * T) * this._normalCDF(d2);
    const vega = spot * this._normalPDF(d1) * Math.sqrt(T) * 0.01;

    return {
      delta: parseFloat(delta.toFixed(4)),
      gamma: parseFloat(gamma.toFixed(6)),
      theta: parseFloat((theta / 365).toFixed(4)),
      vega: parseFloat(vega.toFixed(4)),
    };
  }

  static calculatePnL(position, currentSpot) {
    if (!position || !currentSpot) return null;
    const spot = currentSpot;
    const { type, credit, strikeSell, strikeBuy, sellCall, buyCall, sellPut, buyPut, lotSize = 75 } = position;

    if (type === 'IRON_CONDOR') {
      let currentValue = 0;
      if (spot > sellCall) currentValue -= (spot - sellCall);
      if (spot > buyCall) currentValue += (spot - buyCall);
      if (spot < sellPut) currentValue -= (sellPut - spot);
      if (spot < buyPut) currentValue += (buyPut - spot);
      return (credit - Math.abs(currentValue)) * lotSize;
    }

    if (type === 'BULL_PUT_SPREAD') {
      let currentValue = Math.max(strikeSell - spot, 0) - Math.max(strikeBuy - spot, 0);
      return (credit - currentValue) * lotSize;
    }

    if (type === 'BEAR_CALL_SPREAD') {
      let currentValue = Math.max(spot - strikeSell, 0) - Math.max(spot - strikeBuy, 0);
      return (credit - currentValue) * lotSize;
    }

    return 0;
  }

  static estimateWinRate(spot, strikeDistance, daysToExpiry, historicalVol) {
    const expectedMove = spot * historicalVol * Math.sqrt(daysToExpiry / 252);
    const sigmas = strikeDistance / expectedMove;
    const prob = this._normalCDF(sigmas);
    return parseFloat((prob * 100).toFixed(1));
  }

  static _estimatePremium(spot, strike, days, vol, type) {
    const T = days / 365;
    if (T <= 0 || vol <= 0) return Math.max(type === 'call' ? spot - strike : strike - spot, 0);
    const d1 = (Math.log(spot / strike) + (0.065 + 0.5 * vol ** 2) * T) / (vol * Math.sqrt(T));
    const d2 = d1 - vol * Math.sqrt(T);
    if (type === 'call') {
      return spot * this._normalCDF(d1) - strike * Math.exp(-0.065 * T) * this._normalCDF(d2);
    } else {
      return strike * Math.exp(-0.065 * T) * this._normalCDF(-d2) - spot * this._normalCDF(-d1);
    }
  }

  static _daysUntil(expiry) {
    const d = new Date(expiry) - new Date();
    return Math.max(1, Math.ceil(d / (1000 * 60 * 60 * 24)));
  }

  static _roundToStrike(price) {
    if (price > 20000) return Math.round(price / 100) * 100;
    if (price > 1000) return Math.round(price / 50) * 50;
    return Math.round(price / 10) * 10;
  }

  static _normalCDF(x) {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
  }

  static _normalPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }
}

export default FnoEngine;

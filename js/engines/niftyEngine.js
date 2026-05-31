import MathEngine from './mathEngine.js';

export class NiftyEngine {
  static calculatePivots(high, low, close) {
    return MathEngine.calculatePivots(high, low, close);
  }

  static buildScenarios(niftyData, fnoData = {}, globalContext = {}) {
    const pcr = fnoData.pcr || 1.0;
    const vix = fnoData.vix || 15;
    const fiiNet = fnoData.fiiNetEquity || 0;
    const diiNet = fnoData.diiNetEquity || 0;
    const spot = niftyData?.cmp || 24000;
    const maxPain = fnoData.maxPain || spot;

    const fiiScore = fiiNet > 500 ? 2 : fiiNet > 0 ? 1 : fiiNet < -500 ? -2 : -1;
    const pcrScore = pcr > 1.2 ? 2 : pcr > 1.0 ? 1 : pcr < 0.8 ? -2 : -1;
    const vixScore = vix > 22 ? -2 : vix > 18 ? -1 : vix < 13 ? 1 : 0;
    const globalScore = globalContext.dowFutures > 0 ? 1 : globalContext.dowFutures < -0.5 ? -1 : 0;

    const bullScore = fiiScore + pcrScore - vixScore + globalScore;

    let bullProb, bearProb, sidewaysProb;
    if (bullScore >= 4) { bullProb = 60; bearProb = 15; sidewaysProb = 25; }
    else if (bullScore >= 2) { bullProb = 45; bearProb = 20; sidewaysProb = 35; }
    else if (bullScore >= 0) { bullProb = 30; bearProb = 30; sidewaysProb = 40; }
    else if (bullScore >= -2) { bullProb = 20; bearProb = 45; sidewaysProb = 35; }
    else { bullProb = 15; bearProb = 60; sidewaysProb = 25; }

    const atr = niftyData?.atr || (spot * 0.01);

    return {
      bull: {
        probability: bullProb,
        trigger: `Break and sustain above ${(spot + atr * 0.5).toFixed(0)}`,
        target1: (spot + atr * 1.0).toFixed(0),
        target2: (spot + atr * 2.0).toFixed(0),
        stopLoss: (spot - atr * 0.5).toFixed(0),
        hourByHour: this._bullHourByHour(spot, atr),
        rationale: this._bullRationale(fiiNet, pcr, vix, globalContext),
      },
      bear: {
        probability: bearProb,
        trigger: `Break below ${(spot - atr * 0.5).toFixed(0)} with volume`,
        target1: (spot - atr * 1.0).toFixed(0),
        target2: (spot - atr * 2.0).toFixed(0),
        stopLoss: (spot + atr * 0.5).toFixed(0),
        hourByHour: this._bearHourByHour(spot, atr),
        rationale: this._bearRationale(fiiNet, pcr, vix, globalContext),
      },
      sideways: {
        probability: sidewaysProb,
        range: `${(spot - atr * 0.8).toFixed(0)}–${(spot + atr * 0.8).toFixed(0)}`,
        bestStrategy: 'Iron Condor or sell straddle — time decay favors sellers',
        rationale: `No clear directional bias. Max pain at ${maxPain.toFixed(0)} acts as magnet.`,
      },
    };
  }

  static classifyTrend(prices, sma20, sma50, sma200) {
    if (!prices?.length) return 'UNKNOWN';
    const last = prices[prices.length - 1];
    const s20 = sma20?.at(-1);
    const s50 = sma50?.at(-1);
    const s200 = sma200?.at(-1);
    if (!s20 || !s50 || !s200) return 'INSUFFICIENT_DATA';
    if (last > s20 && last > s50 && last > s200 && s20 > s50 && s50 > s200) return 'STRONG_BULL';
    if (last > s50 && last > s200) return 'BULL';
    if (last < s20 && last < s50 && last < s200) return 'BEAR';
    if (last > s200) return 'RECOVERING';
    return 'NEUTRAL';
  }

  static _bullHourByHour(spot, atr) {
    return [
      { time: '9:15', action: 'Wait for gap-up sustain; buy above open high', target: (spot + atr * 0.3).toFixed(0) },
      { time: '10:00', action: 'Add if 9:15 high holds; early momentum confirms trend', target: (spot + atr * 0.6).toFixed(0) },
      { time: '11:00', action: 'Hold positions; trail SL to breakeven', target: (spot + atr * 1.0).toFixed(0) },
      { time: '12:00', action: 'Manage positions; avoid chasing if market grinds', target: null },
      { time: '14:00', action: 'Position for closing; add on dip to support', target: (spot + atr * 1.5).toFixed(0) },
      { time: '15:15', action: 'Book 50% at T2; hold rest for next-day gap', target: (spot + atr * 2.0).toFixed(0) },
    ];
  }

  static _bearHourByHour(spot, atr) {
    return [
      { time: '9:15', action: 'Short sell if opens below key support; wait for bounce-fail', target: (spot - atr * 0.3).toFixed(0) },
      { time: '10:00', action: 'Sell put options; short if rallies fail at resistance', target: (spot - atr * 0.6).toFixed(0) },
      { time: '11:00', action: 'Hold shorts; cover 25% at T1', target: (spot - atr * 1.0).toFixed(0) },
      { time: '12:00', action: 'Caution — lunchtime squeezes common; tighten SL', target: null },
      { time: '14:00', action: 'Re-enter short if bounce from resistance', target: (spot - atr * 1.5).toFixed(0) },
      { time: '15:15', action: 'Book all by 3:10 — avoid overnight risk', target: (spot - atr * 2.0).toFixed(0) },
    ];
  }

  static _bullRationale(fiiNet, pcr, vix, global) {
    const parts = [];
    if (fiiNet > 0) parts.push(`FII bought ₹${fiiNet.toFixed(0)} Cr — institutional support`);
    if (pcr > 1.0) parts.push(`PCR ${pcr} > 1.0 — put writers dominant, bullish`);
    if (vix < 15) parts.push(`VIX ${vix} — low fear, trending market`);
    if (global.dowFutures > 0) parts.push(`Dow Futures +${global.dowFutures}% — positive global cues`);
    return parts.join('; ') || 'Technical setup supports bullish case.';
  }

  static _bearRationale(fiiNet, pcr, vix, global) {
    const parts = [];
    if (fiiNet < 0) parts.push(`FII sold ₹${Math.abs(fiiNet).toFixed(0)} Cr — distribution phase`);
    if (pcr < 0.8) parts.push(`PCR ${pcr} < 0.8 — call writers dominant, bearish`);
    if (vix > 20) parts.push(`VIX ${vix} — high fear, risk-off`);
    if (global.dowFutures < 0) parts.push(`Dow Futures ${global.dowFutures}% — negative global cues`);
    return parts.join('; ') || 'Technical setup supports bearish case.';
  }
}

export default NiftyEngine;

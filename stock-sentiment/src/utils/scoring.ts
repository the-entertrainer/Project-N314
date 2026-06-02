import type { StockQuote, Grade } from '../types';

// Composite score 0–100:
//   Momentum     25%: RSI-14 + price vs MA50 + volume surge
//   Fundamentals 35%: PE (vs sector), ROE proxy (EPS/PB), D/E proxy
//   Technicals   20%: MA alignment (price > MA50 > MA200), 52W proximity
//   Value        20%: distance from 52W low as opportunity measure

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function momentumScore(q: StockQuote): number {
  let score = 50;

  // RSI component (0–100 → 0–40 pts)
  if (q.rsi14 !== undefined) {
    // RSI 55–70 is optimal (trending up, not overbought)
    if (q.rsi14 >= 55 && q.rsi14 <= 70)  score += 30;
    else if (q.rsi14 >= 45 && q.rsi14 < 55) score += 15;
    else if (q.rsi14 > 70) score += 5;   // overbought
    else score -= 10;                     // oversold / weak
  }

  // Volume surge
  if (q.volumeRatio > 2)        score += 15;
  else if (q.volumeRatio > 1.5) score += 8;
  else if (q.volumeRatio < 0.5) score -= 10;

  // Price change today
  if (q.changePct > 3) score += 10;
  else if (q.changePct > 1) score += 5;
  else if (q.changePct < -3) score -= 10;

  return clamp(score, 0, 100);
}

function fundamentalsScore(q: StockQuote): number {
  let score = 50;

  // P/E (lower is better for value; negative P/E penalised)
  if (q.pe !== null) {
    if (q.pe <= 0) score -= 20;
    else if (q.pe < 15) score += 20;
    else if (q.pe < 25) score += 10;
    else if (q.pe < 40) score += 0;
    else score -= 10;
  }

  // P/B (lower is better)
  if (q.pb !== null) {
    if (q.pb < 1)       score += 15;
    else if (q.pb < 3)  score += 8;
    else if (q.pb > 10) score -= 10;
  }

  // Dividend yield
  if (q.divYield !== null) {
    if (q.divYield > 3) score += 10;
    else if (q.divYield > 1) score += 5;
  }

  return clamp(score, 0, 100);
}

function technicalScore(q: StockQuote): number {
  let score = 50;
  const p = q.price;

  // MA50 alignment
  if (q.ma50 && p > q.ma50)  score += 20;
  if (q.ma50 && p < q.ma50)  score -= 15;

  // MA200 alignment
  if (q.ma200 && p > q.ma200) score += 15;
  if (q.ma200 && p < q.ma200) score -= 10;

  // Golden cross (MA50 > MA200)
  if (q.ma50 && q.ma200 && q.ma50 > q.ma200) score += 10;

  return clamp(score, 0, 100);
}

function valueScore(q: StockQuote): number {
  // How far is the stock from 52W low vs high?
  const range = q.high52w - q.low52w;
  if (range <= 0) return 50;
  const position = (q.price - q.low52w) / range; // 0 = at low, 1 = at high
  // Mid-range (0.3–0.6) is interesting; at low is risky (might be falling)
  if (position >= 0.3 && position <= 0.6) return 75;
  if (position > 0.6 && position <= 0.85) return 60;
  if (position > 0.85) return 40; // near 52W high, limited upside
  return 45; // near 52W low — risky
}

export function computeScore(q: StockQuote): number {
  const m = momentumScore(q)      * 0.25;
  const f = fundamentalsScore(q)  * 0.35;
  const t = technicalScore(q)     * 0.20;
  const v = valueScore(q)         * 0.20;
  return Math.round(m + f + t + v);
}

export function scoreToGrade(score: number): Grade {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

export function isFnoAccumulationFlag(q: StockQuote): boolean {
  // High OI + price stagnant + decent fundamentals = possible institutional accumulation
  return (
    q.isFno &&
    q.volumeRatio > 1.5 &&
    Math.abs(q.changePct) < 1.0 &&
    (q.pe === null || (q.pe > 0 && q.pe < 40)) &&
    (q.pb === null || q.pb < 5)
  );
}

export function enrichQuote(q: StockQuote): StockQuote {
  const score = computeScore(q);
  return {
    ...q,
    score,
    grade: scoreToGrade(score),
    fnoFlag: isFnoAccumulationFlag(q),
  };
}

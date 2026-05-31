import GeminiFetcher from './geminiFetcher.js';
import State from '../state.js';

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000;

export class FnoFetcher {
  static async getLiveData(forceRefresh = false) {
    if (!forceRefresh && _cache && (Date.now() - _cacheTime < CACHE_TTL)) {
      return _cache;
    }

    const apiKey = State.getGeminiKey();
    if (!apiKey) return this._getFallbackData();

    const prompt = `Search NSE India, Moneycontrol, and financial sites for today's market data.
Return ONLY in this exact labeled format (no other text):
PCR: [number like 1.25]
MAX_PAIN: [nifty level number]
FII_NET_EQUITY: [crores, can be negative like -821]
DII_NET_EQUITY: [crores, can be negative]
TOP_CALL_STRIKE: [nifty strike with max OI]
TOP_PUT_STRIKE: [nifty strike with max OI]
INDIA_VIX: [number like 14.5]
NIFTY_ADVANCE: [number of stocks advancing today]
NIFTY_DECLINE: [number of stocks declining today]
NIFTY_CLOSE: [nifty closing/current level]
BANKNIFTY_CLOSE: [banknifty level]
DOW_FUTURES: [percent change like +0.3 or -0.5]`;

    try {
      const text = await GeminiFetcher.searchGrounded(prompt, apiKey);
      const parsed = this._parseLabeled(text);
      const result = {
        pcr: parsed.PCR || 1.0,
        maxPain: parsed.MAX_PAIN || null,
        fiiNetEquity: parsed.FII_NET_EQUITY || 0,
        diiNetEquity: parsed.DII_NET_EQUITY || 0,
        topCallStrike: parsed.TOP_CALL_STRIKE || null,
        topPutStrike: parsed.TOP_PUT_STRIKE || null,
        vix: parsed.INDIA_VIX || 15,
        advance: parsed.NIFTY_ADVANCE || null,
        decline: parsed.NIFTY_DECLINE || null,
        niftyClose: parsed.NIFTY_CLOSE || null,
        bankniftyClose: parsed.BANKNIFTY_CLOSE || null,
        dowFutures: parsed.DOW_FUTURES || 0,
        source: 'AI_ESTIMATED',
        timestamp: Date.now(),
      };
      _cache = result;
      _cacheTime = Date.now();
      return result;
    } catch (e) {
      console.warn('FNO data fetch failed:', e);
      return this._getFallbackData();
    }
  }

  static _parseLabeled(text) {
    const result = {};
    const lines = text.split('\n');
    for (const line of lines) {
      const m = line.match(/^([A-Z_]+):\s*([+-]?\d+\.?\d*)/);
      if (m) result[m[1]] = parseFloat(m[2]);
    }
    return result;
  }

  static _getFallbackData() {
    return {
      pcr: 1.0, maxPain: null, fiiNetEquity: 0, diiNetEquity: 0,
      topCallStrike: null, topPutStrike: null, vix: 15,
      advance: null, decline: null, niftyClose: null, bankniftyClose: null,
      dowFutures: 0, source: 'FALLBACK', timestamp: Date.now(),
    };
  }
}

export default FnoFetcher;

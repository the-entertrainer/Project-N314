import type { FnoData, FiiDiiFlow } from '../types';

const NSE_BASE = 'https://www.nseindia.com';

// We proxy NSE requests through allorigins adding the required Referer header
async function fetchNse(path: string): Promise<any> {
  const url = `${NSE_BASE}${path}`;
  const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(proxied, {
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`NSE responded ${res.status}`);
    return res.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export interface UniverseEntry {
  ticker: string;
  name: string;
  sector: string;
  isFno: boolean;
}

// Fetches live NIFTY 500 constituents from NSE India
export async function fetchNifty500Universe(): Promise<UniverseEntry[]> {
  const data = await fetchNse('/api/equity-stockIndices?index=NIFTY%20500');
  const rows: any[] = data?.data ?? [];

  // Also try to get F&O eligible list for flags
  let fnoSet = new Set<string>();
  try {
    const fnoData = await fetchNse('/api/equity-stockIndices?index=NIFTY%20F%26O');
    (fnoData?.data ?? []).forEach((r: any) => fnoSet.add(r.symbol));
  } catch { /* non-fatal */ }

  return rows
    .filter((r) => r.symbol && r.symbol !== 'NIFTY 500')
    .map((r) => ({
      ticker: r.symbol,
      name: r.meta?.companyName ?? r.symbol,
      sector: r.meta?.industry ?? 'Unknown',
      isFno: fnoSet.has(r.symbol),
    }));
}

// Fetches FII/DII net flow data
export async function fetchFiiDii(): Promise<FiiDiiFlow | null> {
  const data = await fetchNse('/api/fiiDiiData');
  const rows: any[] = Array.isArray(data) ? data : [];
  // NSE returns newest first
  const today = rows[0];
  if (!today) return null;
  return {
    date: today.date ?? new Date().toISOString().slice(0, 10),
    fiiBuy:  parseFloat(today.buyValue  ?? today.fiiBuy  ?? '0'),
    fiiSell: parseFloat(today.sellValue ?? today.fiiSell ?? '0'),
    fiiNet:  parseFloat(today.netValue  ?? today.fiiNet  ?? '0'),
    diiBuy:  parseFloat(today.diiBuy  ?? '0'),
    diiSell: parseFloat(today.diiSell ?? '0'),
    diiNet:  parseFloat(today.diiNet  ?? '0'),
  };
}

// Fetches option chain for a symbol (default NIFTY) to derive PCR + max pain
export async function fetchOptionChain(symbol = 'NIFTY'): Promise<FnoData | null> {
  const data = await fetchNse(`/api/option-chain-indices?symbol=${symbol}`);
  const records: any[] = data?.records?.data ?? [];
  if (!records.length) return null;

  const expiryDate = data?.records?.expiryDates?.[0];
  const filtered = records.filter((r) => r.expiryDate === expiryDate);

  let totalCallOI = 0;
  let totalPutOI = 0;
  const strikePainMap = new Map<number, number>();

  for (const r of filtered) {
    const strike = r.strikePrice ?? 0;
    const callOI = r.CE?.openInterest ?? 0;
    const putOI  = r.PE?.openInterest ?? 0;
    totalCallOI += callOI;
    totalPutOI  += putOI;
    // max pain: strike where total OI pain is minimised
    strikePainMap.set(strike, (strikePainMap.get(strike) ?? 0) + callOI + putOI);
  }

  let maxPain = 0;
  let minPain = Infinity;
  strikePainMap.forEach((pain, strike) => {
    if (pain < minPain) { minPain = pain; maxPain = strike; }
  });

  return {
    symbol,
    oi: totalCallOI + totalPutOI,
    oiChange: 0,
    oiChangePct: 0,
    lotSize: 50, // NIFTY default
    pcr: totalCallOI > 0 ? totalPutOI / totalCallOI : 1,
    maxPain,
    iv: null,
  };
}

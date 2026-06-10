import type { IpoAction, IpoItem } from '../types/powerApps';
import type { IpoFactRecord } from './ipoFacts';
import { deriveSentimentFromRecord } from './ipoFacts';
import { parseIpoAction, parseStringArray } from './powerValidate';

function fallbackAnalysis(record: IpoFactRecord) {
  const n = record.numbers;
  const pros: string[] = [];
  const cons: string[] = [];

  if (n.issue_price != null) {
    pros.push(`Issue price set at ₹${n.issue_price} per NSE filings`);
  }
  if (n.price_range_low != null && n.price_range_high != null) {
    pros.push(`Price band ₹${n.price_range_low}–₹${n.price_range_high} gives a clear valuation anchor (NSE)`);
  }
  if (n.subscription_times != null && n.subscription_times >= 1) {
    const label = n.subscription_times >= 5 ? 'strong' : n.subscription_times >= 2 ? 'decent' : 'modest';
    pros.push(`${n.subscription_times}x subscription shows ${label} demand (NSE)`);
  }
  if (n.shares_offered != null) {
    pros.push(`${n.shares_offered.toLocaleString('en-IN')} shares on offer — size is known (NSE)`);
  }
  if (n.listing_gain_pct != null && n.listing_gain_pct > 0) {
    pros.push(`Stock trades ${n.listing_gain_pct}% above ₹${n.issue_price} issue price (NSE/Yahoo)`);
  }
  if (n.current_price != null) {
    pros.push(`Live price ₹${n.current_price} available for post-listing tracking (Yahoo Finance)`);
  }

  if (n.subscription_times != null && n.subscription_times < 1) {
    cons.push(`Subscription only ${n.subscription_times}x — weak demand signal (NSE)`);
  }
  if (n.listing_gain_pct != null && n.listing_gain_pct < 0) {
    cons.push(`Trading ${Math.abs(n.listing_gain_pct)}% below ₹${n.issue_price} issue price (NSE/Yahoo)`);
  }
  if (n.issue_price != null && n.price_range_high != null && n.issue_price >= n.price_range_high * 0.98) {
    cons.push(`Priced at ₹${n.issue_price}, near top of band ₹${n.price_range_high} — limited listing-day upside`);
  }
  if (record.security_type === 'SME') {
    cons.push(`SME segment (${record.security_type}) — higher volatility and lower liquidity than mainboard`);
  }
  if (pros.length === 0) {
    pros.push(`${record.name} — factual data loaded from NSE; review price band before applying`);
  }
  if (cons.length === 0) {
    cons.push('Insufficient subscription or listing data yet — treat early demand as unconfirmed');
  }

  let action: IpoAction = 'Avoid Completely';
  if (record.status === 'recent') {
    if ((n.listing_gain_pct ?? 0) >= 20) action = 'Apply for Short-Term Listing Gains';
    else if ((n.listing_gain_pct ?? 0) >= 0) action = 'Accumulate for Long-Term Value';
  } else if ((n.subscription_times ?? 0) >= 5) {
    action = 'Apply for Short-Term Listing Gains';
  } else if ((n.subscription_times ?? 0) >= 1.5) {
    action = 'Accumulate for Long-Term Value';
  }

  const topBacking = record.sentiment_backing[0];
  const rationale = topBacking
    ? `${topBacking.metric} at ${topBacking.value} — ${topBacking.implication}. Decision based on verified NSE/Yahoo figures.`
    : `Analysis based on NSE issue data for ${record.symbol}.`;

  const summary =
    n.listing_gain_pct != null
      ? `${record.name}: ₹${n.issue_price} issue → ₹${n.current_price ?? '—'} now (${n.listing_gain_pct >= 0 ? '+' : ''}${n.listing_gain_pct}%)`
      : n.issue_price != null
        ? `${record.name}: ₹${n.issue_price} issue price, band ₹${n.price_range_low ?? '—'}–₹${n.price_range_high ?? '—'}`
        : `${record.name}: open/upcoming issue on NSE`;

  return { pros: pros.slice(0, 4), cons: cons.slice(0, 4), action, rationale, summary };
}

export function mergeIpoAnalysis(
  records: IpoFactRecord[],
  aiIpos: Record<string, unknown>[] | undefined
): IpoItem[] {
  const aiBySymbol = new Map<string, Record<string, unknown>>();
  for (const item of aiIpos || []) {
    const sym = String(item.symbol || '').toUpperCase();
    if (sym) aiBySymbol.set(sym, item);
  }

  return records.map((record) => {
    const fallback = fallbackAnalysis(record);
    const ai = aiBySymbol.get(record.symbol);
    const sentiment = deriveSentimentFromRecord(record);

    return {
      symbol: record.symbol,
      name: record.name,
      status: record.status,
      security_type: record.security_type,
      sentiment,
      numbers: record.numbers,
      facts: record.facts,
      sources: record.sources,
      sentiment_backing: record.sentiment_backing,
      pros: ai ? parseStringArray(ai.pros, 4, 200) : fallback.pros,
      cons: ai ? parseStringArray(ai.cons, 4, 200) : fallback.cons,
      action: ai ? parseIpoAction(String(ai.action || '')) : fallback.action,
      rationale: ai ? String(ai.rationale || fallback.rationale).slice(0, 350) : fallback.rationale,
      summary: ai ? String(ai.summary || fallback.summary).slice(0, 280) : fallback.summary,
    };
  });
}
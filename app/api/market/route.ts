import { NextRequest, NextResponse } from 'next/server';

interface HistoricalDataPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'indices';
  const symbol = searchParams.get('symbol');

  let url = '';

  if (type === 'historical' && symbol) {
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (30 * 24 * 60 * 60);
    url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
  } else if (type === 'indices') {
    url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=^NSEI,^NSEBANK,^BSESN`;
  } else if (type === 'popular') {
    url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS,ICICIBANK.NS`;
  } else {
    url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol || '^NSEI'}`;
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; N314/1.0)' },
      next: { revalidate: type === 'historical' ? 300 : 25 },
    });

    if (!res.ok) throw new Error('Yahoo API error');

    const data = await res.json();

    if (type === 'historical') {
      const result = data.chart?.result?.[0];
      const timestamps = result?.timestamp || [];
      const quotes = result?.indicators?.quote?.[0] || {};

      const historicalData: HistoricalDataPoint[] = timestamps
        .map((time: number, i: number) => ({
          date: new Date(time * 1000).toISOString().split('T')[0],
          open: quotes.open?.[i],
          high: quotes.high?.[i],
          low: quotes.low?.[i],
          close: quotes.close?.[i],
          volume: quotes.volume?.[i],
        }))
        .filter((d: HistoricalDataPoint) => d.close);

      return NextResponse.json({ success: true, data: historicalData });
    }

    return NextResponse.json({ success: true, data: data.quoteResponse?.result || [] });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
    console.error(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

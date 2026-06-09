import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance proxy for Indian markets
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'indices';
  const symbol = searchParams.get('symbol');

  let symbols = '';
  let url = '';

  if (type === 'historical' && symbol) {
    // Get last 30 days of daily data
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (30 * 24 * 60 * 60);
    url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
  } else if (type === 'indices') {
    symbols = '^NSEI,^NSEBANK,^BSESN';
    url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
  } else if (type === 'popular') {
    symbols = 'RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS,ICICIBANK.NS';
    url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
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

      const historicalData = timestamps.map((time: number, i: number) => ({
        date: new Date(time * 1000).toISOString().split('T')[0],
        open: quotes.open?.[i],
        high: quotes.high?.[i],
        low: quotes.low?.[i],
        close: quotes.close?.[i],
        volume: quotes.volume?.[i],
      })).filter((d: any) => d.close);

      return NextResponse.json({ success: true, data: historicalData });
    }

    return NextResponse.json({ success: true, data: data.quoteResponse?.result || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch data' }, { status: 500 });
  }
}

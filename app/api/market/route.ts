import { NextRequest, NextResponse } from 'next/server';

// Free Yahoo Finance proxy for Indian stocks (symbols end with .NS)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'indices';
  const symbol = searchParams.get('symbol');

  try {
    let url = '';

    if (type === 'indices') {
      url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=^NSEI,^NSEBANK,^BSESN';
    } else if (type === 'stocks' && symbol) {
      url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    } else {
      // Popular stocks
      url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS,ICICIBANK.NS';
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; N314/1.0)',
      },
      next: { revalidate: 30 }, // Cache 30s
    });

    if (!res.ok) throw new Error('Yahoo API error');

    const data = await res.json();
    return NextResponse.json({ success: true, data: data.quoteResponse?.result || data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch market data' }, { status: 500 });
  }
}

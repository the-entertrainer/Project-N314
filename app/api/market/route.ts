import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance proxy for Indian markets (NSE symbols end with .NS)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'indices';

  let symbols = '';

  if (type === 'indices') {
    symbols = '^NSEI,^NSEBANK,^BSESN,^CNXIT';
  } else if (type === 'popular') {
    symbols = 'RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS,ICICIBANK.NS,SBIN.NS,LT.NS,ITC.NS';
  } else {
    symbols = searchParams.get('symbols') || '^NSEI';
  }

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; N314/1.0)',
      },
      next: { revalidate: 25 }, // Cache for 25 seconds
    });

    if (!res.ok) {
      throw new Error('Yahoo Finance API error');
    }

    const data = await res.json();
    const results = data.quoteResponse?.result || [];

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Market data fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

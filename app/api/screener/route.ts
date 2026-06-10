import { NextRequest, NextResponse } from 'next/server';
import { getNifty500Registry, getStockBySymbol } from '../../../lib/nifty500';

export async function GET() {
  const registry = getNifty500Registry();
  return NextResponse.json({
    success: true,
    count: registry.length,
    data: registry,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { symbol } = await request.json();
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const stock = getStockBySymbol(symbol);
    if (!stock) {
      return NextResponse.json({ error: 'Symbol not found in Nifty 500 registry' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: stock });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
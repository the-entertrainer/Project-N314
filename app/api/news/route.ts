import { NextRequest, NextResponse } from 'next/server';
import { fetchRelevantNews } from '../../../lib/newsFetcher';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const company = searchParams.get('company') || undefined;

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const articles = await fetchRelevantNews(symbol, company);
    return NextResponse.json({ success: true, data: articles });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch news';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
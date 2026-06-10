import { NextRequest, NextResponse } from 'next/server';
import { callGroq } from '../../../lib/groq';

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    const response = await callGroq([
      {
        role: 'system',
        content:
          'You are N314 AI Stock Advisor — an expert on Indian and global equity markets. Provide concise, actionable insights. When discussing predictions, note uncertainty and key risk factors.',
      },
      { role: 'user', content: prompt },
    ]);

    return NextResponse.json({ success: true, response });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Groq API error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
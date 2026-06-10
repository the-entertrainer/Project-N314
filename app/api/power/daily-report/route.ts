import { NextResponse } from 'next/server';
import { gatherDailyReportData } from '../../../../lib/dailyReportData';
import { groqDailyReportPartA, groqDailyReportPartB } from '../../../../lib/dailyReportGroq';
import { mergeDailyReport } from '../../../../lib/dailyReportMerge';
import { GroqRateLimitError } from '../../../../lib/groq';

export const maxDuration = 60;

export async function POST() {
  try {
    const data = await gatherDailyReportData();

    const [rawA, rawB] = await Promise.all([
      groqDailyReportPartA(data),
      groqDailyReportPartB(data),
    ]);

    const partA = JSON.parse(rawA) as Record<string, unknown>;
    const partB = JSON.parse(rawB) as Record<string, unknown>;
    const report = mergeDailyReport(data, partA, partB);

    return NextResponse.json({ success: true, data: report });
  } catch (e) {
    if (e instanceof GroqRateLimitError) {
      return NextResponse.json(
        { success: false, error: 'Groq rate limit. Try again shortly.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Daily report generation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
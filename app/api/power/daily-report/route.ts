import { NextResponse } from 'next/server';
import { gatherDailyReportData } from '../../../../lib/dailyReportData';
import { generateAllReportParts } from '../../../../lib/dailyReportAi';
import { mergeDailyReport } from '../../../../lib/dailyReportMerge';
import { parseAiJson } from '../../../../lib/parseAiJson';
import { GeminiRateLimitError, GeminiApiError } from '../../../../lib/gemini';

export const maxDuration = 60;

export async function POST() {
  try {
    const data = await gatherDailyReportData();

    const { summaryRaw, top25Raws, fnoRaw, sectorsRaw } = await generateAllReportParts(data);

    const summary = parseAiJson(summaryRaw);
    const top25Parts = top25Raws.map((raw) => parseAiJson(raw));
    const fno = parseAiJson(fnoRaw);
    const sectors = parseAiJson(sectorsRaw);

    const report = mergeDailyReport(data, summary, top25Parts, fno, sectors);

    return NextResponse.json({ success: true, data: report });
  } catch (e) {
    if (e instanceof GeminiRateLimitError) {
      return NextResponse.json(
        { success: false, error: 'Gemini rate limit. Wait a moment and try again.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }
    if (e instanceof GeminiApiError) {
      return NextResponse.json(
        { success: false, error: e.message, code: 'GEMINI_ERROR' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'Daily report generation failed',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
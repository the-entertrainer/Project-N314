import { NextResponse } from 'next/server';
import { gatherDailyReportData } from '../../../../lib/dailyReportData';
import { buildDailyReport } from '../../../../lib/dailyReportBuilder';

export const maxDuration = 60;

export async function POST() {
  try {
    const data = await gatherDailyReportData();
    const report = buildDailyReport(data);
    return NextResponse.json({ success: true, data: report });
  } catch (e) {
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
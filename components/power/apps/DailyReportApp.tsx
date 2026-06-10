'use client';

import { useState, useCallback } from 'react';
import { Loader2, Printer, RefreshCw, FileText, Download } from 'lucide-react';
import { downloadDailyReportExcel } from '../../../lib/dailyReportExcel';
import PowerAppLayout from '../PowerAppLayout';
import DailyReportDocument, { printDailyReport } from '../DailyReportDocument';
import { POWER_APPS } from '../../../lib/powerRoutes';
import { useDailyReportStore } from '../../../store/dailyReportStore';
import type { DailyReport } from '../../../types/dailyReport';

const dailyMeta = POWER_APPS[5];

function ErrorBox({ error }: { error: string }) {
  return <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>;
}

export function DailyReportApp() {
  const { report, generatedAt, setReport, clearReport } = useDailyReportStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [excelLoading, setExcelLoading] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    setProgress('Fetching NSE, Yahoo Finance & screening stocks…');
    try {
      const res = await fetch('/api/power/daily-report', { method: 'POST' });
      setProgress('Building report from live market data…');
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Report generation failed');
        return;
      }
      setReport(json.data as DailyReport);
      setProgress('');
    } catch {
      setError('Network error — could not generate report');
    } finally {
      setLoading(false);
    }
  }, [setReport]);

  const downloadExcel = useCallback(async () => {
    if (!report) return;
    setExcelLoading(true);
    try {
      await downloadDailyReportExcel(report);
    } catch {
      setError('Could not generate Excel file — try again');
    } finally {
      setExcelLoading(false);
    }
  }, [report]);

  return (
    <PowerAppLayout
      title={dailyMeta.title}
      subtitle={dailyMeta.subtitle}
      icon={dailyMeta.icon}
      path={dailyMeta.path}
      settings={
        <div className="space-y-3 no-print">
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Builds a full institutional report from direct APIs (NSE, Yahoo Finance, Nifty 500) — no AI rate limits. Export as print/PDF or a color-coded Excel workbook.
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {loading ? 'Building Report…' : report ? 'Refresh Report' : 'Generate Daily Report'}
          </button>
          {loading && progress && (
            <p className="text-[10px] text-emerald-400/80 text-center animate-pulse">{progress}</p>
          )}
          {report && !loading && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={printDailyReport}
                  className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 text-xs"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button
                  onClick={downloadExcel}
                  disabled={excelLoading}
                  className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 text-xs bg-emerald-600/90 hover:bg-emerald-500"
                >
                  {excelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {excelLoading ? 'Building…' : 'Download Excel'}
                </button>
              </div>
              <button
                onClick={clearReport}
                className="w-full px-3 py-2 rounded-2xl border border-white/10 text-zinc-500 hover:text-zinc-300 text-xs flex items-center justify-center gap-2"
                aria-label="Clear saved report"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Clear saved report
              </button>
            </div>
          )}
          {generatedAt && (
            <p className="text-[10px] text-zinc-600 text-center">
              Last generated: {new Date(generatedAt).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      }
    >
      {error && <ErrorBox error={error} />}
      {!report && !loading && !error && (
        <div className="text-center py-12 text-zinc-500 text-sm no-print">
          Tap <span className="text-emerald-400">Generate Daily Report</span> to compile today&apos;s market intelligence from live data feeds.
        </div>
      )}
      {report && <DailyReportDocument report={report} />}
    </PowerAppLayout>
  );
}
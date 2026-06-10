'use client';

import { useState, useCallback } from 'react';
import { Loader2, FileDown, Sparkles, RefreshCw } from 'lucide-react';
import PowerAppLayout from '../PowerAppLayout';
import DailyReportViewer from '../DailyReportViewer';
import { POWER_APPS } from '../../../lib/powerRoutes';
import { useDailyReportStore } from '../../../store/dailyReportStore';
import { downloadDailyReportPdf } from '../../../lib/dailyReportPdf';
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

  const generate = useCallback(async () => {
    setLoading(true);
    setError('');
    setProgress('Gathering NSE, Yahoo & screener data…');
    try {
      const res = await fetch('/api/power/daily-report', { method: 'POST' });
      setProgress('Synthesizing institutional analysis…');
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

  const handleDownloadPdf = () => {
    if (report) downloadDailyReportPdf(report);
  };

  return (
    <PowerAppLayout
      title={dailyMeta.title}
      subtitle={dailyMeta.subtitle}
      icon={dailyMeta.icon}
      path={dailyMeta.path}
      settings={
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Generates an institutional-grade daily report covering equities, F&O, sectors, IPOs, and actionable ideas — backed by live NSE & market data.
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating Report…' : report ? 'Regenerate Report' : 'Generate Daily Report'}
          </button>
          {loading && progress && (
            <p className="text-[10px] text-emerald-400/80 text-center animate-pulse">{progress}</p>
          )}
          {report && !loading && (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPdf}
                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 text-xs"
              >
                <FileDown className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={clearReport}
                className="px-3 py-2.5 rounded-2xl border border-white/10 text-zinc-500 hover:text-zinc-300 text-xs"
                aria-label="Clear saved report"
              >
                <RefreshCw className="w-4 h-4" />
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
        <div className="text-center py-12 text-zinc-500 text-sm">
          Tap <span className="text-emerald-400">Generate Daily Report</span> to build today&apos;s institutional intelligence PDF.
        </div>
      )}
      {report && <DailyReportViewer report={report} />}
    </PowerAppLayout>
  );
}
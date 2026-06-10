import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DailyReport } from '../types/dailyReport';

interface DailyReportState {
  report: DailyReport | null;
  generatedAt: string | null;
  setReport: (report: DailyReport) => void;
  clearReport: () => void;
}

export const useDailyReportStore = create<DailyReportState>()(
  persist(
    (set) => ({
      report: null,
      generatedAt: null,
      setReport: (report) => set({ report, generatedAt: report.generated_at }),
      clearReport: () => set({ report: null, generatedAt: null }),
    }),
    { name: 'n314-daily-report' }
  )
);
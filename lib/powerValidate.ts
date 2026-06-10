import type { IpoAction } from '../types/powerApps';

export function parseStringArray(raw: unknown, maxItems = 5, maxLen = 150): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item).slice(0, maxLen)).slice(0, maxItems);
}

export function parseAiBreakdown(raw: Record<string, unknown>) {
  return {
    plain_summary: String(raw.plain_summary || '').slice(0, 500),
    logic_steps: Array.isArray(raw.logic_steps)
      ? raw.logic_steps.map((s) => String(s).slice(0, 200)).slice(0, 5)
      : [],
    indicator_explanation: String(raw.indicator_explanation || '').slice(0, 400),
  };
}

export function parseStrategies(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      const item = s as Record<string, unknown>;
      return {
        name: String(item.name || 'Strategy').slice(0, 80),
        steps: Array.isArray(item.steps) ? item.steps.map((x) => String(x).slice(0, 120)).slice(0, 4) : [],
        why: String(item.why || '').slice(0, 200),
      };
    })
    .slice(0, 3);
}

export function parseIpoAction(raw: string): IpoAction {
  if (raw === 'Apply for Short-Term Listing Gains') return raw;
  if (raw === 'Accumulate for Long-Term Value') return raw;
  return 'Avoid Completely';
}
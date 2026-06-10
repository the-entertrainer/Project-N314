'use client';

interface AiInsightPanelProps {
  plainSummary?: string;
  indicatorExplanation?: string;
  logicSteps?: string[];
  children?: React.ReactNode;
}

export default function AiInsightPanel({
  plainSummary,
  indicatorExplanation,
  logicSteps,
  children,
}: AiInsightPanelProps) {
  if (!plainSummary && !indicatorExplanation && !logicSteps?.length && !children) return null;

  return (
    <div className="space-y-4">
      {plainSummary && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Plain Summary</div>
          <p className="text-sm text-zinc-200 leading-relaxed">{plainSummary}</p>
        </div>
      )}
      {indicatorExplanation && (
        <div className="bg-zinc-900/60 rounded-2xl p-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">What The Numbers Mean</div>
          <p className="text-sm text-zinc-300 leading-relaxed">{indicatorExplanation}</p>
        </div>
      )}
      {logicSteps && logicSteps.length > 0 && (
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Step-by-Step Logic</div>
          <ol className="space-y-2">
            {logicSteps.map((step, i) => (
              <li key={i} className="text-sm text-zinc-400 flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {children}
    </div>
  );
}
import React from 'react';
import { useAppStore } from '../../store/appStore';
import type { SourceStatus } from '../../types';
import { timeAgo } from '../../utils/formatters';

interface PillProps {
  label: string;
  status: SourceStatus;
}

const StatusDot: React.FC<{ s: SourceStatus['status'] }> = ({ s }) => {
  const cls =
    s === 'done'     ? 'bg-teal-400' :
    s === 'partial'  ? 'bg-amber-400' :
    s === 'fetching' ? 'bg-blue-400 animate-pulse' :
    s === 'failed'   ? 'bg-red-400' :
    'bg-white/20';
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${cls}`} />;
};

const Pill: React.FC<PillProps> = ({ label, status }) => {
  const text =
    status.status === 'partial' && status.loaded != null && status.total != null
      ? `${status.loaded}/${status.total}`
      : status.status === 'done' && status.total != null
      ? `${status.total}`
      : status.status === 'done'
      ? 'Live'
      : status.status === 'fetching'
      ? '...'
      : status.status === 'failed'
      ? 'Failed'
      : 'Idle';

  return (
    <span className="status-pill flex items-center gap-1.5 text-xs font-mono">
      <StatusDot s={status.status} />
      <span className="text-white/50">{label}:</span>
      <span className={status.status === 'failed' ? 'text-red-400' : status.status === 'done' ? 'text-teal-400' : 'text-white/70'}>
        {text}
      </span>
      {status.lastUpdated && status.status === 'done' && (
        <span className="text-white/30">{timeAgo(status.lastUpdated)}</span>
      )}
    </span>
  );
};

const DataStatusBar: React.FC = () => {
  const dataStatus = useAppStore((s) => s.dataStatus);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 bg-white/3 border-b border-white/5 text-xs">
      <Pill label="Universe" status={dataStatus.universe} />
      <Pill label="Prices"   status={dataStatus.prices} />
      <Pill label="Indices"  status={dataStatus.indices} />
      <Pill label="FII/DII"  status={dataStatus.fiiDii} />
      <Pill label="F&O"      status={dataStatus.fno} />
      <Pill label="News"     status={dataStatus.news} />
    </div>
  );
};

export default DataStatusBar;

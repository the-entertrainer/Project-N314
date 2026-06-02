import React from 'react';
import { useAppStore } from '../../store/appStore';

const SENTIMENT_STYLE: Record<string, string> = {
  Bullish:  'bg-teal-500/15 text-teal-300 border-teal-500/30',
  Bearish:  'bg-red-500/15 text-red-400 border-red-500/30',
  Neutral:  'bg-white/5 text-white/40 border-white/10',
};

const timeLabel = (iso: string): string => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
};

const NewsCard: React.FC<{
  title: string; snippet: string; uri: string; source: string;
  publishedAt: string; sentiment?: string;
}> = ({ title, snippet, uri, source, publishedAt, sentiment }) => (
  <a
    href={uri}
    target="_blank"
    rel="noopener noreferrer"
    className="block glass-card rounded-xl p-4 hover:bg-white/8 transition-all duration-200 border border-white/5 hover:border-white/12 group"
  >
    <div className="flex items-start justify-between gap-3 mb-2">
      <h3 className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors leading-snug">
        {title}
      </h3>
      {sentiment && (
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded border font-mono ${SENTIMENT_STYLE[sentiment] ?? SENTIMENT_STYLE['Neutral']}`}>
          {sentiment}
        </span>
      )}
    </div>
    {snippet && <p className="text-xs text-white/40 mb-3 line-clamp-2">{snippet}</p>}
    <div className="flex items-center gap-2 text-xs text-white/25">
      <span className="font-medium text-white/40">{source}</span>
      <span>·</span>
      <span>{timeLabel(publishedAt)}</span>
      <svg className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </div>
  </a>
);

const NewsModule: React.FC = () => {
  const news       = useAppStore((s) => s.news);
  const dataStatus = useAppStore((s) => s.dataStatus.news);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-mono uppercase text-white/30 tracking-widest">Market News</h2>
        <span className="text-xs text-white/25 font-mono">
          {dataStatus.status === 'done' ? `${news.length} articles` :
           dataStatus.status === 'fetching' ? 'Loading...' :
           dataStatus.status === 'failed' ? 'No API key — add GNEWS_API_KEY' :
           'Idle'}
        </span>
      </div>

      {dataStatus.status === 'failed' && (
        <div className="glass-card rounded-xl p-6 text-center mb-4">
          <p className="text-white/40 text-sm mb-1">News feed unavailable</p>
          <p className="text-white/25 text-xs">
            Add a <code className="text-teal-400">GNEWS_API_KEY</code> environment variable to enable live news.
            Free tier: 100 requests/day at gnews.io
          </p>
        </div>
      )}

      {dataStatus.status === 'fetching' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
        </div>
      )}

      {news.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {news.map((article, i) => (
            <NewsCard
              key={i}
              title={article.title}
              snippet={article.snippet}
              uri={article.uri}
              source={article.source}
              publishedAt={article.publishedAt}
              sentiment={article.sentiment}
            />
          ))}
        </div>
      )}

      {news.length === 0 && dataStatus.status === 'done' && (
        <div className="text-center text-white/30 py-12 text-sm">No articles available</div>
      )}
    </div>
  );
};

export default NewsModule;

export const fmtPrice = (v: number | null | undefined): string => {
  if (v == null) return '—';
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fmtPct = (v: number | null | undefined, decimals = 2): string => {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;
};

export const fmtMktCap = (v: number | null | undefined): string => {
  if (v == null) return '—';
  if (v >= 1e12) return `₹${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9)  return `₹${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e7)  return `₹${(v / 1e7).toFixed(0)} Cr`;
  return `₹${v.toFixed(0)}`;
};

export const fmtCr = (v: number | null | undefined): string => {
  if (v == null) return '—';
  const cr = Math.abs(v) / 10_000_000;
  const sign = v < 0 ? '-' : '+';
  if (cr >= 10_000) return `${sign}₹${(cr / 1_000).toFixed(1)}K Cr`;
  return `${sign}₹${cr.toFixed(0)} Cr`;
};

export const fmtNum = (v: number | null | undefined, decimals = 2): string => {
  if (v == null) return '—';
  return v.toFixed(decimals);
};

export const fmtVol = (v: number | null | undefined): string => {
  if (v == null) return '—';
  if (v >= 1e7) return `${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(2)} L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
};

export const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
};

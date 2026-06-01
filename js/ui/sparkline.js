/**
 * Sparkline — tiny inline SVG price chart for table rows and cards.
 */
export function sparkline(prices, width = 64, height = 24) {
  if (!prices || prices.length < 3) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <line x1="4" y1="${height / 2}" x2="${width - 4}" y2="${height / 2}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,2"/>
    </svg>`;
  }

  const n = Math.min(prices.length, 40);
  const pts = prices.slice(-n);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const coords = pts.map((p, i) => {
    const x = pad + (i / (n - 1)) * w;
    const y = pad + h - ((p - min) / range) * h;
    return [x.toFixed(1), y.toFixed(1)];
  });

  const isUp = pts[pts.length - 1] >= pts[0];
  const color = isUp ? '#10b981' : '#f43f5e';
  const id = `sp${Math.random().toString(36).substr(2, 6)}`;

  const polyline = coords.map(c => c.join(',')).join(' ');
  const area = `${coords[0][0]},${height} ${polyline} ${coords[coords.length - 1][0]},${height}`;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="${area}" fill="url(#${id})"/>
    <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${coords[coords.length - 1][0]}" cy="${coords[coords.length - 1][1]}" r="2" fill="${color}"/>
  </svg>`;
}

/** Mini RSI indicator — a narrow horizontal bar with a colored position marker */
export function rsiIndicator(rsi) {
  if (rsi === null || rsi === undefined) return '<span class="text-gray-300 text-xs">—</span>';
  const v = Math.min(100, Math.max(0, rsi));
  const pct = v.toFixed(0);
  const color = v < 30 ? '#10b981' : v > 70 ? '#f43f5e' : '#6366f1';
  const label = v < 30 ? 'OS' : v > 70 ? 'OB' : '';
  const textCls = v < 30 ? 'text-emerald-600' : v > 70 ? 'text-red-500' : 'text-indigo-600';

  return `<div class="flex items-center gap-1.5" title="RSI: ${pct}${label ? ' (' + (label === 'OS' ? 'Oversold' : 'Overbought') + ')' : ''}">
    <span class="tabular-nums text-xs font-medium ${textCls} w-7 text-right">${pct}</span>
    <div class="rsi-bar-track" style="width:36px;height:4px;background:#e2e8f0;border-radius:4px;position:relative;overflow:hidden">
      <div style="position:absolute;left:0;top:0;height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 0.6s ease"></div>
    </div>
  </div>`;
}

/** Score bar — animated fill */
export function scoreBar(score) {
  const w = Math.min(100, Math.max(0, score || 0));
  const color = w >= 75 ? '#10b981' : w >= 55 ? '#f59e0b' : '#f43f5e';
  return `<div class="flex items-center gap-1.5">
    <span class="tabular-nums text-xs font-semibold text-gray-700 w-6 text-right">${w}</span>
    <div style="flex:1;height:4px;background:#e2e8f0;border-radius:4px;overflow:hidden;max-width:48px">
      <div class="score-fill" style="height:100%;width:${w}%;background:${color};border-radius:4px;transition:width 0.8s ease"></div>
    </div>
  </div>`;
}

export default sparkline;

import UIManager from './uiManager.js';
import { sparkline, rsiIndicator, scoreBar } from './sparkline.js';

const ROW_HEIGHT = 52;
const BUFFER = 10;

export class TableRenderer {
  constructor(scrollContainerId, tableBodyId, data, columns, onRowClick) {
    this.container = document.getElementById(scrollContainerId);
    this.tableBody = document.getElementById(tableBodyId);
    this.spacerTop = document.getElementById(`${scrollContainerId}-spacer-top`);
    this.spacerBottom = document.getElementById(`${scrollContainerId}-spacer-bottom`);
    this.data = data;
    this.columns = columns;
    this.onRowClick = onRowClick;
    this._firstRow = 0;
    this._lastRow = 0;
    this._bound = this._onScroll.bind(this);
    if (this.container) this.container.addEventListener('scroll', this._bound, { passive: true });
    this._render();
  }

  updateData(newData) {
    this.data = newData;
    this._firstRow = 0;
    if (this.container) this.container.scrollTop = 0;
    this._render();
  }

  destroy() {
    if (this.container) this.container.removeEventListener('scroll', this._bound);
  }

  _onScroll() {
    this._render();
  }

  _render() {
    if (!this.container || !this.tableBody) return;
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    const totalRows = this.data.length;
    const totalHeight = totalRows * ROW_HEIGHT;

    const firstVisible = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
    const lastVisible = Math.min(totalRows - 1, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER);

    if (firstVisible === this._firstRow && lastVisible === this._lastRow) return;
    this._firstRow = firstVisible;
    this._lastRow = lastVisible;

    const topSpace = firstVisible * ROW_HEIGHT;
    const bottomSpace = (totalRows - lastVisible - 1) * ROW_HEIGHT;

    if (this.spacerTop) this.spacerTop.style.height = `${topSpace}px`;
    if (this.spacerBottom) this.spacerBottom.style.height = `${Math.max(0, bottomSpace)}px`;

    const fragment = document.createDocumentFragment();
    for (let i = firstVisible; i <= lastVisible && i < totalRows; i++) {
      fragment.appendChild(this._buildRow(this.data[i], i));
    }
    this.tableBody.innerHTML = '';
    this.tableBody.appendChild(fragment);
  }

  _buildRow(stock, idx) {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-100 hover:bg-indigo-50/40 cursor-pointer transition-colors';
    tr.style.height = `${ROW_HEIGHT}px`;
    tr.dataset.ticker = stock.ticker;

    const cells = this.columns.map(col => {
      const td = document.createElement('td');
      td.className = `px-3 py-2 text-sm ${col.class || ''}`;
      td.innerHTML = col.render ? col.render(stock, idx) : (stock[col.key] ?? 'N/A');
      return td;
    });
    tr.append(...cells);

    if (this.onRowClick) tr.addEventListener('click', () => this.onRowClick(stock));
    return tr;
  }
}

const TREND_SVG = {
  BULLISH: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  BEARISH: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`,
  MIXED_BULLISH: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  MIXED_BEARISH: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  NEUTRAL: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
};

export function buildScreenerColumns() {
  return [
    { key: 'rank', class: 'text-gray-400 w-8', render: (_, i) => `<span class="text-xs font-mono">${i + 1}</span>` },
    {
      key: 'ticker', class: 'font-mono', render: s =>
        `<div><div class="font-semibold text-gray-800 text-sm">${s.ticker.replace('.NS', '')}</div><div class="text-xs text-gray-400 truncate max-w-[6rem]">${s.name || ''}</div></div>`
    },
    {
      key: 'chart', class: 'w-16', render: s =>
        sparkline(s.rawPrices, 64, 24)
    },
    {
      key: 'cmp', class: 'text-right tabular-nums', render: s =>
        `<div class="text-gray-800 font-medium text-sm">₹${s.cmp?.toFixed(2) || '—'}</div><div class="text-xs">${UIManager.formatPercent(s.returnDaily)}</div>`
    },
    {
      key: 'score', class: 'w-28', render: s => scoreBar(s.score || 0)
    },
    {
      key: 'grade', class: 'text-center w-12', render: s =>
        `<span class="px-2 py-0.5 rounded text-xs font-bold ${UIManager.gradeColor(s.grade)}">${s.grade || 'C'}</span>`
    },
    {
      key: 'rsi', class: 'w-24', render: s => rsiIndicator(s.rsi)
    },
    {
      key: 'trend', class: 'text-center w-10', render: s =>
        `<span title="${s.trend || 'NEUTRAL'}">${TREND_SVG[s.trend] || TREND_SVG.NEUTRAL}</span>`
    },
    { key: 'pe', class: 'text-right tabular-nums text-gray-600 text-xs', render: s => s.pe?.toFixed(1) || '—' },
    { key: 'returnMonthly', class: 'text-right tabular-nums', render: s => UIManager.formatPercent(s.returnMonthly) },
    {
      key: 'isFno', class: 'text-center', render: s =>
        s.isFno ? '<span class="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">F&O</span>' : ''
    },
    {
      key: 'institutionalFlag', class: 'text-center', render: s =>
        s.institutionalFlag ? '<span class="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-medium">INST</span>' : ''
    },
  ];
}

export default TableRenderer;

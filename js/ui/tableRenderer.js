import UIManager from './uiManager.js';

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

export function buildScreenerColumns() {
  return [
    { key: 'rank', class: 'text-gray-400 w-10', render: (_, i) => `<span class="text-xs">${i + 1}</span>` },
    {
      key: 'ticker', class: 'font-mono text-accent', render: s =>
        `<div><div class="font-semibold text-gray-800">${s.ticker.replace('.NS', '')}</div><div class="text-xs text-gray-500 truncate max-w-28">${s.name || ''}</div></div>`
    },
    {
      key: 'cmp', class: 'text-right tabular-nums', render: s =>
        `<div class="text-gray-800 font-medium">₹${s.cmp?.toFixed(2) || 'N/A'}</div><div class="text-xs">${UIManager.formatPercent(s.returnDaily)}</div>`
    },
    {
      key: 'score', class: 'w-24', render: s =>
        `<div class="flex items-center gap-1"><span class="font-bold text-gray-800 w-6 text-right">${s.score || 0}</span>${UIManager.scoreBar(s.score || 0)}</div>`
    },
    {
      key: 'grade', class: 'text-center', render: s =>
        `<span class="px-2 py-0.5 rounded text-xs font-bold ${UIManager.gradeColor(s.grade)}">${s.grade || 'C'}</span>`
    },
    {
      key: 'rsi', class: 'text-right tabular-nums', render: s => {
        const v = s.rsi;
        if (v === null || v === undefined) return '<span class="text-gray-400">N/A</span>';
        const c = v < 30 ? 'text-green-600' : v > 70 ? 'text-red-500' : 'text-gray-700';
        return `<span class="${c}">${v.toFixed(1)}</span>`;
      }
    },
    {
      key: 'trend', class: 'text-center', render: s => {
        const map = { BULLISH: '🟢', BEARISH: '🔴', MIXED_BULLISH: '🟡', MIXED_BEARISH: '🟠', NEUTRAL: '⚪' };
        return `<span title="${s.trend || ''}">${map[s.trend] || '—'}</span>`;
      }
    },
    { key: 'pe', class: 'text-right tabular-nums text-gray-600', render: s => s.pe?.toFixed(1) || '—' },
    { key: 'returnMonthly', class: 'text-right tabular-nums', render: s => UIManager.formatPercent(s.returnMonthly) },
    {
      key: 'isFno', class: 'text-center', render: s =>
        s.isFno ? '<span class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">F&O</span>' : ''
    },
    {
      key: 'institutionalFlag', class: 'text-center', render: s =>
        s.institutionalFlag ? '<span class="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">★ INST</span>' : ''
    },
  ];
}

export default TableRenderer;

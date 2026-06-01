import State from '../state.js';
import YahooFetcher from '../fetchers/yahooFetcher.js';
import { TableRenderer, buildScreenerColumns } from '../ui/tableRenderer.js';
import UIManager from '../ui/uiManager.js';
import ChartRenderer from '../ui/chartRenderer.js';
import ExcelExporter from '../ui/excelExporter.js';
import RationaleEngine from '../engines/rationaleEngine.js';

let _renderer = null;
let _filteredData = [];
let _currentFilters = { sector: 'all', grade: 'all', fnoOnly: false, instOnly: false, search: '' };
let _sortKey = 'score';
let _sortDir = -1;
let _filterTimeout;

export async function initScreener() {
  _bindControls();
  document.addEventListener('statechange', e => {
    if (e.detail.key === 'stocks_all' || e.detail.key === 'fetchStatus') _refreshTable();
  });

  if (State.isStaleFetch()) {
    await _triggerFetch();
  } else {
    _refreshTable();
  }
}

async function _triggerFetch() {
  if (_renderer) {
    _renderer.destroy();
    _renderer = null;
  }
  UIManager.showProgress('screener-content', 0, 1, 'Connecting to Yahoo Finance...');

  try {
    await YahooFetcher.fetchAll500((current, total) => {
      if (!_renderer) {
        // Table not yet rendered — safe to show full progress overlay
        UIManager.showProgress('screener-content', current, total, `Fetching quotes ${current}/${total}...`);
      } else {
        // Table already rendered — update the lightweight header status only
        const countEl = document.getElementById('screener-count');
        if (countEl) countEl.textContent = `Enriching data ${current}/${total}...`;
      }
    });
  } catch (e) {
    UIManager.showError('screener-content', `Data fetch failed: ${e.message}`, _triggerFetch);
    UIManager.showToast(`Fetch error: ${e.message}`, 'error');
  }

  // Ensure count shows final result
  const countEl = document.getElementById('screener-count');
  if (countEl) countEl.textContent = `${_filteredData.length} stocks`;
}

function _refreshTable() {
  _filteredData = _applyFilters([...State.stocks.values()]);
  _filteredData.sort((a, b) => _sortDir * ((a[_sortKey] || 0) < (b[_sortKey] || 0) ? -1 : 1));
  _populateSectorFilter();

  const container = document.getElementById('screener-content');
  if (!container) return;

  if (_renderer) {
    _renderer.updateData(_filteredData);
  } else {
    container.innerHTML = _buildTableHTML();
    _renderer = new TableRenderer(
      'screener-scroll', 'screener-tbody', _filteredData,
      buildScreenerColumns(), _showStockModal
    );
  }

  const countEl = document.getElementById('screener-count');
  if (countEl) countEl.textContent = `${_filteredData.length} stocks`;
}

function _buildTableHTML() {
  return `
    <div id="screener-scroll" class="overflow-y-auto" style="height:calc(100vh - 280px)">
      <div id="screener-scroll-spacer-top" style="height:0"></div>
      <table class="w-full text-left border-collapse">
        <thead class="sticky top-0 z-10" style="background:rgba(255,255,255,0.92);backdrop-filter:blur(12px);">
          <tr class="border-b border-gray-200">
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 w-8">#</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-pointer hover:text-gray-700" data-sort="ticker">Stock</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 w-16">Chart</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 text-right cursor-pointer hover:text-gray-700" data-sort="cmp">CMP</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 w-28 cursor-pointer hover:text-gray-700" data-sort="score">Score</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 text-center w-12 cursor-pointer hover:text-gray-700" data-sort="grade">Grade</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 w-24 cursor-pointer hover:text-gray-700" data-sort="rsi">RSI</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 text-center w-10">Trend</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 text-right cursor-pointer hover:text-gray-700" data-sort="pe">P/E</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 text-right cursor-pointer hover:text-gray-700" data-sort="returnMonthly">1M%</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 text-center">F&O</th>
            <th class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 text-center">Inst</th>
          </tr>
        </thead>
        <tbody id="screener-tbody"></tbody>
      </table>
      <div id="screener-scroll-spacer-bottom" style="height:0"></div>
    </div>`;
}

function _showStockModal(stock) {
  const r = stock.rationale || RationaleEngine.buildStockRationale(stock);
  const techHtml = (r.technicalSignals || []).map(s => `<li class="text-sm text-gray-600">${s}</li>`).join('');
  const fundHtml = (r.fundamentalSignals || []).map(s => `<li class="text-sm text-gray-600">${s}</li>`).join('');
  const riskHtml = (r.risks || []).map(s => `<li class="text-sm text-red-400">${s}</li>`).join('');

  const content = `
    <div class="space-y-5">
      <div class="flex flex-wrap gap-3 items-center">
        <span class="text-2xl font-bold text-gray-800">₹${stock.cmp?.toFixed(2) || 'N/A'}</span>
        <span>${UIManager.formatPercent(stock.returnDaily)} today</span>
        <span class="px-2 py-0.5 rounded text-sm font-bold ${UIManager.gradeColor(stock.grade)}">${stock.grade} — ${stock.score}/100</span>
      </div>
      <div id="modal-price-chart" class="w-full"></div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${_statCard('RSI', stock.rsi?.toFixed(1))}
        ${_statCard('P/E', stock.pe?.toFixed(1))}
        ${_statCard('ROE', stock.roe ? stock.roe.toFixed(1) + '%' : null)}
        ${_statCard('D/E', stock.debtEquity?.toFixed(2))}
        ${_statCard('Margin', stock.profitMargin ? stock.profitMargin.toFixed(1) + '%' : null)}
        ${_statCard('Beta', stock.beta?.toFixed(2))}
        ${_statCard('52W H', '₹' + (stock.high52w?.toFixed(0) || 'N/A'))}
        ${_statCard('52W L', '₹' + (stock.low52w?.toFixed(0) || 'N/A'))}
        ${_statCard('Mkt Cap', UIManager.formatMarketCap(stock.marketCap))}
      </div>

      ${r.recommendationBasis ? `<div class="bg-accent/10 border border-accent/30 rounded-lg p-4"><p class="text-accent font-semibold text-sm">${r.recommendationBasis}</p></div>` : ''}

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${techHtml ? `<div><h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Technical Signals</h4><ul class="space-y-1">${techHtml}</ul></div>` : ''}
        ${fundHtml ? `<div><h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Fundamental Signals</h4><ul class="space-y-1">${fundHtml}</ul></div>` : ''}
      </div>
      ${riskHtml ? `<div><h4 class="text-xs font-semibold text-red-400 uppercase mb-2">Key Risks</h4><ul class="space-y-1">${riskHtml}</ul></div>` : ''}
      ${r.aiNarrative ? `<div class="bg-purple-50 border border-purple-200 rounded-lg p-4"><h4 class="text-xs font-semibold text-purple-600 uppercase mb-2">AI Narrative</h4><p class="text-gray-700 text-sm leading-relaxed">${r.aiNarrative}</p></div>` : ''}
    </div>`;

  UIManager.showModal(`${stock.name} (${stock.ticker.replace('.NS', '')})`, content, null);
  setTimeout(() => {
    try {
      ChartRenderer.renderPriceChart('modal-price-chart', stock);
    } catch (e) {
      const el = document.getElementById('modal-price-chart');
      if (el) el.innerHTML = '<div class="text-center text-red-500 text-sm">Chart unavailable</div>';
    }
  }, 150);
}

function _statCard(label, value) {
  return `<div class="metric-card"><div class="metric-label">${label}</div><div class="text-gray-800 font-semibold text-base mt-0.5">${value || '—'}</div></div>`;
}

function _applyFilters(stocks) {
  return stocks.filter(s => {
    if (_currentFilters.sector !== 'all' && s.sector !== _currentFilters.sector) return false;
    if (_currentFilters.grade !== 'all' && s.grade !== _currentFilters.grade) return false;
    if (_currentFilters.fnoOnly && !s.isFno) return false;
    if (_currentFilters.instOnly && !s.institutionalFlag) return false;
    if (_currentFilters.search) {
      const q = _currentFilters.search.toLowerCase();
      if (!s.ticker?.toLowerCase().includes(q) && !s.name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function _populateSectorFilter() {
  const sel = document.getElementById('filter-sector');
  if (!sel || sel.options.length > 1) return;
  const sectors = [...new Set([...State.stocks.values()].map(s => s.sector))].sort();
  sectors.forEach(sec => { const o = document.createElement('option'); o.value = sec; o.textContent = sec; sel.appendChild(o); });
}

function _bindControls() {
  const _debouncedRefresh = () => {
    clearTimeout(_filterTimeout);
    _filterTimeout = setTimeout(_refreshTable, 250);
  };
  document.getElementById('filter-sector')?.addEventListener('change', e => { _currentFilters.sector = e.target.value; _debouncedRefresh(); });
  document.getElementById('filter-grade')?.addEventListener('change', e => { _currentFilters.grade = e.target.value; _debouncedRefresh(); });
  document.getElementById('filter-fno')?.addEventListener('change', e => { _currentFilters.fnoOnly = e.target.checked; _debouncedRefresh(); });
  document.getElementById('filter-inst')?.addEventListener('change', e => { _currentFilters.instOnly = e.target.checked; _debouncedRefresh(); });
  document.getElementById('screener-search')?.addEventListener('input', e => { _currentFilters.search = e.target.value; _debouncedRefresh(); });

  document.getElementById('btn-refresh')?.addEventListener('click', _triggerFetch);
  document.getElementById('btn-export')?.addEventListener('click', async () => {
    const container = document.getElementById('screener-content');
    UIManager.showProgress(container?.id || 'screener-content', 0, 1, 'Generating Excel file...');
    try {
      const filename = await ExcelExporter.generate();
      _refreshTable();
      UIManager.showToast(`Downloaded ${filename}`, 'success');
    } catch (e) {
      UIManager.showError(container?.id || 'screener-content', `Export failed: ${e.message}`);
    }
  });

  document.getElementById('screener-content')?.addEventListener('click', e => {
    const th = e.target.closest('[data-sort]');
    if (th) {
      const key = th.dataset.sort;
      if (_sortKey === key) _sortDir *= -1;
      else { _sortKey = key; _sortDir = -1; }
      _refreshTable();
    }
  });
}

export default initScreener;

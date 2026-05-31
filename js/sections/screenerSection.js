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
  const container = document.getElementById('screener-content');
  UIManager.showProgress('screener-content', 0, 1, 'Initializing data fetch...');

  try {
    await YahooFetcher.fetchAll500((current, total) => {
      UIManager.showProgress('screener-content', current, total, `Fetching batch ${current}/${total}...`);
    });
  } catch (e) {
    UIManager.showError('screener-content', `Data fetch failed: ${e.message}`, _triggerFetch);
    UIManager.showToast(`Fetch error: ${e.message}`, 'error');
  }
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
        <thead class="sticky top-0 bg-surface-800 z-10">
          <tr class="border-b border-surface-600">
            <th class="px-3 py-2 text-xs text-surface-400 w-10">#</th>
            <th class="px-3 py-2 text-xs text-surface-400 cursor-pointer hover:text-white" data-sort="ticker">Stock</th>
            <th class="px-3 py-2 text-xs text-surface-400 text-right cursor-pointer hover:text-white" data-sort="cmp">CMP</th>
            <th class="px-3 py-2 text-xs text-surface-400 cursor-pointer hover:text-white" data-sort="score">Score</th>
            <th class="px-3 py-2 text-xs text-surface-400 text-center cursor-pointer hover:text-white" data-sort="grade">Grade</th>
            <th class="px-3 py-2 text-xs text-surface-400 text-right cursor-pointer hover:text-white" data-sort="rsi">RSI</th>
            <th class="px-3 py-2 text-xs text-surface-400 text-center">Trend</th>
            <th class="px-3 py-2 text-xs text-surface-400 text-right cursor-pointer hover:text-white" data-sort="pe">P/E</th>
            <th class="px-3 py-2 text-xs text-surface-400 text-right cursor-pointer hover:text-white" data-sort="returnMonthly">1M%</th>
            <th class="px-3 py-2 text-xs text-surface-400 text-center">F&O</th>
            <th class="px-3 py-2 text-xs text-surface-400 text-center">Inst</th>
          </tr>
        </thead>
        <tbody id="screener-tbody"></tbody>
      </table>
      <div id="screener-scroll-spacer-bottom" style="height:0"></div>
    </div>`;
}

function _showStockModal(stock) {
  const r = stock.rationale || RationaleEngine.buildStockRationale(stock);
  const techHtml = (r.technicalSignals || []).map(s => `<li class="text-sm text-surface-300">${s}</li>`).join('');
  const fundHtml = (r.fundamentalSignals || []).map(s => `<li class="text-sm text-surface-300">${s}</li>`).join('');
  const riskHtml = (r.risks || []).map(s => `<li class="text-sm text-red-400">${s}</li>`).join('');

  const content = `
    <div class="space-y-5">
      <div class="flex flex-wrap gap-3 items-center">
        <span class="text-2xl font-bold text-white">₹${stock.cmp?.toFixed(2) || 'N/A'}</span>
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
        ${techHtml ? `<div><h4 class="text-xs font-semibold text-surface-400 uppercase mb-2">Technical Signals</h4><ul class="space-y-1">${techHtml}</ul></div>` : ''}
        ${fundHtml ? `<div><h4 class="text-xs font-semibold text-surface-400 uppercase mb-2">Fundamental Signals</h4><ul class="space-y-1">${fundHtml}</ul></div>` : ''}
      </div>
      ${riskHtml ? `<div><h4 class="text-xs font-semibold text-red-400 uppercase mb-2">Key Risks</h4><ul class="space-y-1">${riskHtml}</ul></div>` : ''}
      ${r.aiNarrative ? `<div class="bg-surface-700 rounded-lg p-4"><h4 class="text-xs font-semibold text-purple-400 uppercase mb-2">AI Narrative</h4><p class="text-surface-300 text-sm leading-relaxed">${r.aiNarrative}</p></div>` : ''}
    </div>`;

  UIManager.showModal(`${stock.name} (${stock.ticker.replace('.NS', '')})`, content, null);
  setTimeout(() => ChartRenderer.renderPriceChart('modal-price-chart', stock), 50);
}

function _statCard(label, value) {
  return `<div class="bg-surface-700 rounded-lg p-3"><div class="text-xs text-surface-400">${label}</div><div class="text-white font-semibold mt-0.5">${value || 'N/A'}</div></div>`;
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
  document.getElementById('filter-sector')?.addEventListener('change', e => { _currentFilters.sector = e.target.value; _refreshTable(); });
  document.getElementById('filter-grade')?.addEventListener('change', e => { _currentFilters.grade = e.target.value; _refreshTable(); });
  document.getElementById('filter-fno')?.addEventListener('change', e => { _currentFilters.fnoOnly = e.target.checked; _refreshTable(); });
  document.getElementById('filter-inst')?.addEventListener('change', e => { _currentFilters.instOnly = e.target.checked; _refreshTable(); });
  document.getElementById('screener-search')?.addEventListener('input', e => { _currentFilters.search = e.target.value; _refreshTable(); });

  document.getElementById('btn-refresh')?.addEventListener('click', _triggerFetch);
  document.getElementById('btn-export')?.addEventListener('click', async () => {
    try {
      const filename = await ExcelExporter.generate();
      UIManager.showToast(`Downloaded ${filename}`, 'success');
    } catch (e) {
      UIManager.showToast(`Export failed: ${e.message}`, 'error');
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

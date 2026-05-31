import State from '../state.js';
import UIManager from '../ui/uiManager.js';
import ChartRenderer from '../ui/chartRenderer.js';

export function initWatchlist() {
  _render();
  _bindControls();
  document.addEventListener('statechange', e => {
    if (e.detail.key === 'watchlist' || e.detail.key === 'stocks_all') _render();
  });
}

function _render() {
  const container = document.getElementById('watchlist-content');
  if (!container) return;

  if (!State.watchlist.length) {
    container.innerHTML = `
      <div class="text-center py-16">
        <div class="text-5xl mb-4">⭐</div>
        <h3 class="text-xl font-bold text-white mb-2">Your Watchlist</h3>
        <p class="text-surface-400 max-w-md mx-auto mb-4">Add stocks from the Screener to track them here. Your watchlist is saved locally.</p>
        <p class="text-surface-500 text-sm">Use the search below to add stocks manually.</p>
      </div>`;
    return;
  }

  const cards = State.watchlist.map(entry => {
    const stock = State.stocks.get(entry.ticker) || entry;
    return _buildWatchCard(stock);
  }).join('');

  container.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>`;

  container.querySelectorAll('.btn-remove-watch').forEach(btn => {
    btn.addEventListener('click', () => {
      State.removeFromWatchlist(btn.dataset.ticker);
    });
  });

  container.querySelectorAll('.watch-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      const ticker = card.dataset.ticker;
      const stock = State.stocks.get(ticker);
      if (stock?.rawPrices?.length) {
        const content = `<div id="wl-chart"></div>`;
        UIManager.showModal(stock.name, content);
        setTimeout(() => ChartRenderer.renderPriceChart('wl-chart', stock), 50);
      }
    });
  });
}

function _buildWatchCard(stock) {
  const changeCls = (stock.returnDaily || 0) >= 0 ? 'text-green-400' : 'text-red-400';
  const changeStr = stock.returnDaily !== null && stock.returnDaily !== undefined
    ? `${stock.returnDaily >= 0 ? '+' : ''}${stock.returnDaily.toFixed(2)}%` : 'N/A';

  return `
    <div class="watch-card bg-surface-800 rounded-xl p-4 cursor-pointer hover:bg-surface-750 transition-colors relative border border-surface-700" data-ticker="${stock.ticker}">
      <button class="btn-remove-watch absolute top-3 right-3 text-surface-500 hover:text-red-400 transition-colors text-lg" data-ticker="${stock.ticker}">×</button>
      <div class="pr-6">
        <div class="font-bold text-white">${stock.ticker?.replace('.NS', '')}</div>
        <div class="text-xs text-surface-400 truncate">${stock.name || ''}</div>
      </div>
      <div class="flex items-end justify-between mt-3">
        <div>
          <div class="text-xl font-bold text-white">${stock.cmp ? '₹' + stock.cmp.toFixed(2) : '—'}</div>
          <div class="text-sm ${changeCls}">${changeStr}</div>
        </div>
        <div class="text-right">
          <span class="px-2 py-0.5 rounded text-xs font-bold ${UIManager.gradeColor(stock.grade)}">${stock.grade || '—'}</span>
          <div class="text-xs text-surface-400 mt-1">${stock.sector || ''}</div>
        </div>
      </div>
      ${stock.score !== undefined ? `<div class="mt-2">${UIManager.scoreBar(stock.score)}</div>` : ''}
      <div class="mt-2 flex gap-2 text-xs text-surface-400">
        ${stock.rsi !== null && stock.rsi !== undefined ? `<span>RSI: <span class="text-white">${stock.rsi.toFixed(1)}</span></span>` : ''}
        ${stock.pe ? `<span>P/E: <span class="text-white">${stock.pe.toFixed(1)}</span></span>` : ''}
        ${stock.isFno ? '<span class="bg-blue-900 text-blue-300 px-1.5 rounded">F&O</span>' : ''}
      </div>
    </div>`;
}

function _bindControls() {
  const searchInput = document.getElementById('watchlist-search');
  const searchResults = document.getElementById('watchlist-search-results');

  if (!searchInput) return;
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) { searchResults.innerHTML = ''; return; }
    const matches = [...State.stocks.values()]
      .filter(s => s.ticker?.toLowerCase().includes(q) || s.name?.toLowerCase().includes(q))
      .slice(0, 8);
    searchResults.innerHTML = matches.map(s => `
      <button class="w-full text-left px-3 py-2 hover:bg-surface-700 flex items-center justify-between rounded" data-ticker="${s.ticker}">
        <div>
          <span class="font-semibold text-white text-sm">${s.ticker.replace('.NS', '')}</span>
          <span class="text-surface-400 text-xs ml-2">${s.name}</span>
        </div>
        <span class="text-xs ${s.returnDaily >= 0 ? 'text-green-400' : 'text-red-400'}">${s.returnDaily?.toFixed(2) || ''}%</span>
      </button>`).join('');
    searchResults.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const ticker = btn.dataset.ticker;
        State.addToWatchlist({ ticker });
        searchInput.value = '';
        searchResults.innerHTML = '';
        UIManager.showToast(`${ticker.replace('.NS', '')} added to watchlist`, 'success');
      });
    });
  });
}

export default initWatchlist;

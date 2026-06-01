import State from '../state.js';
import GeminiFetcher from '../fetchers/geminiFetcher.js';
import UIManager from '../ui/uiManager.js';

export function initPostMarket() {
  _render();
  _bindControls();
  document.addEventListener('statechange', e => {
    if (e.detail.key === 'stocks_all' || e.detail.key === 'postMarketLog') _render();
  });
}

function _render() {
  _renderSummary();
  _renderLog();
}

function _renderSummary() {
  const stocks = [...State.stocks.values()].filter(s => s.returnDaily !== null && s.returnDaily !== undefined);
  if (!stocks.length) {
    const el = document.getElementById('postmarket-summary');
    if (el) el.innerHTML = '<p class="text-gray-400 text-center py-8">Run the Screener to load market data first.</p>';
    return;
  }

  const sorted = [...stocks].sort((a, b) => b.returnDaily - a.returnDaily);
  const gainers = sorted.slice(0, 5);
  const losers = sorted.slice(-5).reverse();
  const niftyStock = State.niftyData;

  const gainersHtml = gainers.map(s => `
    <div class="flex items-center justify-between py-1.5">
      <span class="text-gray-800 font-medium text-sm">${s.ticker.replace('.NS', '')}</span>
      <span class="text-green-400 font-bold text-sm">+${s.returnDaily.toFixed(2)}%</span>
    </div>`).join('');

  const losersHtml = losers.map(s => `
    <div class="flex items-center justify-between py-1.5">
      <span class="text-gray-800 font-medium text-sm">${s.ticker.replace('.NS', '')}</span>
      <span class="text-red-400 font-bold text-sm">${s.returnDaily.toFixed(2)}%</span>
    </div>`).join('');

  const el = document.getElementById('postmarket-summary');
  if (el) el.innerHTML = `
    <div class="grid grid-cols-2 gap-4">
      <div class="glass-card p-4">
        <h4 class="text-xs font-semibold text-green-600 uppercase mb-3">Top 5 Gainers</h4>
        ${gainersHtml}
      </div>
      <div class="glass-card p-4">
        <h4 class="text-xs font-semibold text-red-500 uppercase mb-3">Top 5 Losers</h4>
        ${losersHtml}
      </div>
    </div>`;
}

function _renderLog() {
  const container = document.getElementById('postmarket-log');
  if (!container) return;
  if (!State.postMarketLog.length) {
    container.innerHTML = '<p class="text-gray-400 text-sm text-center py-6">No post-market entries yet. Generate an AI analysis or add notes below.</p>';
    return;
  }
  container.innerHTML = State.postMarketLog.map(e => `
    <div class="glass-card p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-gray-500">${new Date(e.timestamp).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        ${e.source === 'AI' ? '<span class="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">AI Generated</span>' : ''}
      </div>
      ${e.summary ? `<p class="text-gray-700 text-sm leading-relaxed">${e.summary}</p>` : ''}
      ${e.whatWorked ? `<div class="mt-2"><span class="text-xs font-semibold text-green-600">What Worked: </span><span class="text-sm text-gray-600">${e.whatWorked}</span></div>` : ''}
      ${e.whatFailed ? `<div class="mt-1"><span class="text-xs font-semibold text-red-500">What Failed: </span><span class="text-sm text-gray-600">${e.whatFailed}</span></div>` : ''}
      ${e.watchTomorrow ? `<div class="mt-1"><span class="text-xs font-semibold text-yellow-600">Watch Tomorrow: </span><span class="text-sm text-gray-600">${e.watchTomorrow}</span></div>` : ''}
      ${e.notes ? `<p class="text-gray-400 text-sm mt-2 italic">${e.notes}</p>` : ''}
    </div>`).join('');
}

function _bindControls() {
  document.getElementById('btn-generate-postmarket')?.addEventListener('click', _generateAI);

  const notesEl = document.getElementById('postmarket-notes');
  if (notesEl) {
    notesEl.addEventListener('blur', () => {
      const notes = notesEl.value.trim();
      if (notes) {
        State.addPostMarketEntry({ notes, source: 'MANUAL' });
        notesEl.value = '';
        UIManager.showToast('Notes saved', 'success');
      }
    });
  }
}

async function _generateAI() {
  const apiKey = State.getGeminiKey();
  if (!apiKey) { UIManager.showToast('Add Gemini API key in Settings', 'warning'); return; }

  const btn = document.getElementById('btn-generate-postmarket');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating...'; }

  try {
    const stocks = [...State.stocks.values()].filter(s => s.returnDaily !== null);
    const sorted = [...stocks].sort((a, b) => b.returnDaily - a.returnDaily);
    const gainers = sorted.slice(0, 5).map(s => `${s.ticker.replace('.NS', '')} +${s.returnDaily.toFixed(2)}%`).join(', ');
    const losers = sorted.slice(-5).reverse().map(s => `${s.ticker.replace('.NS', '')} ${s.returnDaily.toFixed(2)}%`).join(', ');
    const avgChange = stocks.reduce((s, a) => s + a.returnDaily, 0) / stocks.length;

    const prompt = `You are a senior Indian equity market analyst writing a post-market summary for today.

Market Data:
- Average Nifty 500 stock change: ${avgChange.toFixed(2)}%
- Top 5 Gainers: ${gainers}
- Top 5 Losers: ${losers}
- Date: ${new Date().toLocaleDateString('en-IN')}

Provide a comprehensive post-market analysis with:
1. Market summary (what happened and why)
2. What worked (strategies/sectors that paid off)
3. What failed (strategies that didn't work)
4. Key things to watch tomorrow
5. Brief overnight risk factors`;

    const schema = {
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING' },
        whatWorked: { type: 'STRING' },
        whatFailed: { type: 'STRING' },
        watchTomorrow: { type: 'STRING' },
        overnightRisks: { type: 'STRING' },
      },
      required: ['summary', 'whatWorked', 'whatFailed', 'watchTomorrow'],
    };

    const result = await GeminiFetcher.analyzeStructured(prompt, schema, apiKey);
    State.addPostMarketEntry({ ...result, source: 'AI', topGainer: gainers.split(',')[0], topLoser: losers.split(',')[0] });
    UIManager.showToast('Post-market analysis generated!', 'success');
  } catch (e) {
    UIManager.showToast(`Error: ${e.message}`, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate AI Analysis'; }
  }
}

export default initPostMarket;

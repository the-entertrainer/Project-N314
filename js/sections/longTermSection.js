import State from '../state.js';
import GeminiFetcher from '../fetchers/geminiFetcher.js';
import UIManager from '../ui/uiManager.js';

let _initialized = false;

export async function initLongTerm() {
  _render();
  document.addEventListener('statechange', e => {
    if (e.detail.key === 'longTermList') _render();
    if (e.detail.key === 'stocks_all' && !_initialized) _checkAutoGenerate();
  });

  if (State.longTermList.length === 0 && State.stocks.size > 0) {
    _checkAutoGenerate();
  }
}

function _checkAutoGenerate() {
  if (State.stocks.size > 50 && State.longTermList.length === 0) {
    document.getElementById('longterm-empty')?.classList.remove('hidden');
  }
}

async function _generateLongTermList() {
  const apiKey = State.getGeminiKey();
  if (!apiKey) {
    UIManager.showToast('Add your Gemini API key in Settings first', 'warning');
    return;
  }

  const btn = document.getElementById('btn-generate-longterm');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating...'; }

  try {
    UIManager.showLoading('longterm-list', 'Gemini is curating 25 long-term wealth creators...');

    // Filter candidates: grade AA+, D/E < 1, ROE > 15, margin > 12
    const candidates = [...State.stocks.values()]
      .filter(s =>
        (s.grade === 'AAA' || s.grade === 'AA' || s.grade === 'A') &&
        (s.debtEquity == null || s.debtEquity < 1) &&
        (s.roe == null || s.roe > 15) &&
        (s.profitMargin == null || s.profitMargin > 12)
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 40);

    if (candidates.length < 10) {
      UIManager.showToast('Insufficient scored data. Please refresh screener first.', 'warning');
      return;
    }

    const stockSummary = candidates.map(s => ({
      ticker: s.ticker.replace('.NS', ''),
      name: s.name, sector: s.sector, score: s.score, grade: s.grade,
      cmp: s.cmp, pe: s.pe, roe: s.roe, debtEquity: s.debtEquity,
      profitMargin: s.profitMargin, returnMonthly: s.returnMonthly, return1y: s.return1y,
      trend: s.trend, rsi: s.rsi,
    }));

    const prompt = `You're a knowledgeable friend helping someone invest their savings wisely for the next 10 years.
From these ${candidates.length} Nifty 500 stocks, pick the BEST 25 you'd genuinely recommend to a friend for long-term wealth creation.

Think simply: which businesses are hard to replace? Which grow with India? Which aren't overpriced right now?
Write each thesis like you're explaining to a smart friend — clear, honest, no buzzwords. No "synergies", no "robust frameworks".

CANDIDATE STOCKS:
${JSON.stringify(stockSummary, null, 2)}

Use the exact JSON schema below for your 25 picks.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        picks: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              ticker: { type: 'STRING' },
              name: { type: 'STRING' },
              moat: { type: 'STRING' },
              growthDrivers: { type: 'ARRAY', items: { type: 'STRING' } },
              valuationCase: { type: 'STRING' },
              technicalEntry: { type: 'STRING' },
              tenYearThesis: { type: 'STRING' },
              risks: { type: 'ARRAY', items: { type: 'STRING' } },
              suggestedSIPMonthly: { type: 'STRING' },
              buyZone: { type: 'STRING' },
              bearCase: { type: 'STRING' },
            },
            required: ['ticker', 'name', 'moat', 'tenYearThesis'],
          },
        },
      },
      required: ['picks'],
    };

    const result = await GeminiFetcher.analyzeStructured(prompt, schema, apiKey);
    const picks = (result.picks || [])
      .filter(p => p.ticker)
      .map(p => {
        const stockData = State.stocks.get(p.ticker + '.NS') || State.stocks.get(p.ticker) || {};
        return { ...stockData, ...p, ticker: (p.ticker.includes('.NS') ? p.ticker : p.ticker + '.NS') };
      });

    State.setLongTermList(picks);
    UIManager.showToast(`${picks.length} long-term picks generated!`, 'success');
  } catch (e) {
    UIManager.showError('longterm-list', `Error: ${e.message}`, _generateLongTermList);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Refresh Long-Term Analysis'; }
  }
}

function _render() {
  const container = document.getElementById('longterm-list');
  if (!container) return;

  if (!State.longTermList.length) {
    container.innerHTML = `
      <div id="longterm-empty" class="text-center py-16">
        <div class="text-6xl mb-4">🌱</div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Long-Term Equity Picks</h3>
        <p class="text-gray-500 max-w-md mx-auto mb-6">
          Gemini AI will analyze the Nifty 500 universe and curate 25 stocks for a 10-year wealth creation portfolio — with full investment thesis, moat analysis, and buy zones.
        </p>
        <p class="text-gray-400 text-sm mb-6">
          ${State.stocks.size === 0 ? '⚠ Run the Screener first to load stock data.' : `${State.stocks.size} stocks loaded and ready.`}
        </p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      ${State.longTermList.map((s, i) => _buildPickCard(s, i)).join('')}
    </div>`;

  container.querySelectorAll('.pick-expand-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const body = btn.closest('.pick-card').querySelector('.pick-body');
      const isHidden = body.classList.contains('hidden');
      body.classList.toggle('hidden', !isHidden);
      btn.textContent = isHidden ? '▲ Collapse' : '▼ Read Full Thesis';
    });
  });
}

function _buildPickCard(s, i) {
  const stock = State.stocks.get(s.ticker) || s;
  const grade = stock.grade || s.grade || 'A';
  const cmp = stock.cmp ? `₹${stock.cmp.toFixed(2)}` : 'N/A';
  const growthHtml = (s.growthDrivers || []).map(g => `<li class="text-sm text-gray-600 flex gap-2"><span class="text-accent mt-0.5">→</span>${g}</li>`).join('');
  const risksHtml = (s.risks || []).map(r => `<li class="text-sm text-red-500 flex gap-2"><span class="mt-0.5">⚠</span>${r}</li>`).join('');

  return `
    <div class="pick-card glass-card overflow-hidden">
      <div class="p-4">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <span class="text-gray-400 text-xs">#${i + 1}</span>
            <h3 class="font-bold text-gray-800">${s.name || s.ticker}</h3>
            <p class="text-xs text-gray-500">${stock.sector || ''} · ${s.ticker.replace('.NS', '')}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="px-2 py-0.5 rounded text-xs font-bold ${UIManager.gradeColor(grade)}">${grade}</span>
            <div class="text-gray-800 font-bold mt-1">${cmp}</div>
          </div>
        </div>

        ${s.buyZone ? `<div class="flex items-center gap-2 mb-3"><span class="text-xs text-gray-500">Buy Zone:</span><span class="text-green-600 font-semibold text-sm">${s.buyZone}</span></div>` : ''}

        <div class="space-y-2 mb-3">
          <div class="flex gap-2"><span class="text-xs font-semibold text-blue-600 w-16 flex-shrink-0">MOAT</span><p class="text-xs text-gray-600">${s.moat || 'N/A'}</p></div>
          <div class="flex gap-2"><span class="text-xs font-semibold text-purple-600 w-16 flex-shrink-0">ENTRY</span><p class="text-xs text-gray-600">${s.technicalEntry || 'N/A'}</p></div>
          <div class="flex gap-2"><span class="text-xs font-semibold text-yellow-600 w-16 flex-shrink-0">VALUE</span><p class="text-xs text-gray-600">${s.valuationCase || 'N/A'}</p></div>
        </div>

        <button class="pick-expand-btn text-xs text-accent hover:text-accent/80 transition-colors">▼ Read Full Thesis</button>
      </div>

      <div class="pick-body hidden border-t border-gray-200 p-4 space-y-4 bg-white/40">
        ${s.tenYearThesis ? `<div><h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">10-Year Investment Thesis</h4><p class="text-sm text-gray-700 leading-relaxed">${s.tenYearThesis}</p></div>` : ''}
        ${growthHtml ? `<div><h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Growth Drivers</h4><ul class="space-y-1">${growthHtml}</ul></div>` : ''}
        ${s.bearCase ? `<div><h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Bear Case</h4><p class="text-sm text-orange-600">${s.bearCase}</p></div>` : ''}
        ${risksHtml ? `<div><h4 class="text-xs font-semibold text-red-500 uppercase mb-2">Key Risks</h4><ul class="space-y-1">${risksHtml}</ul></div>` : ''}
        ${s.suggestedSIPMonthly ? `<div class="bg-green-50 border border-green-200 rounded-lg p-3"><p class="text-xs text-gray-500">Suggested Monthly SIP</p><p class="text-green-700 font-semibold">${s.suggestedSIPMonthly}</p></div>` : ''}
      </div>
    </div>`;
}

export function bindLongTermButtons() {
  document.getElementById('btn-generate-longterm')?.addEventListener('click', _generateLongTermList);
}

export default initLongTerm;

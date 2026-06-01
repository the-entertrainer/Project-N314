import State from '../state.js';
import GeminiFetcher from '../fetchers/geminiFetcher.js';
import FnoFetcher from '../fetchers/fnoFetcher.js';
import NiftyEngine from '../engines/niftyEngine.js';
import MathEngine from '../engines/mathEngine.js';
import UIManager from '../ui/uiManager.js';

let _fnoData = null;

export async function initStrategy() {
  _renderSkeleton();
  _bindControls();
  await _loadFnoData();
}

async function _loadFnoData() {
  try {
    _fnoData = await FnoFetcher.getLiveData();
    _renderPivots();
    _renderFnoData();
  } catch (e) {
    UIManager.showToast('Could not load F&O data: ' + e.message, 'warning');
  }
}

function _renderSkeleton() {
  const container = document.getElementById('strategy-content');
  if (!container) return;
  container.innerHTML = `
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" id="strategy-metrics">
      ${['INDIA VIX', 'PCR', 'FII Net', 'Max Pain'].map(l => `
        <div class="glass-card p-4 text-center">
          <div class="text-xs text-gray-500 mb-1">${l}</div>
          <div class="text-2xl font-bold text-gray-800" id="metric-${l.replace(/\s/g, '-').toLowerCase()}">—</div>
          ${l === 'FII Net' ? '<div class="text-xs text-gray-400">AI Estimated</div>' : ''}
        </div>`).join('')}
    </div>

    <div id="pivot-section" class="mb-6"></div>

    <div id="scenario-section" class="mb-6">
      <div class="text-center py-8 text-gray-400">
        <p class="text-sm">Click "Generate Strategy" to get AI-powered market scenarios</p>
      </div>
    </div>

    <div id="ai-strategy-section" class="space-y-4"></div>`;
}

function _renderFnoData() {
  if (!_fnoData) return;
  const fields = {
    'metric-india-vix': _fnoData.vix,
    'metric-pcr': _fnoData.pcr,
    'metric-fii-net': _fnoData.fiiNetEquity ? `₹${_fnoData.fiiNetEquity}Cr` : '—',
    'metric-max-pain': _fnoData.maxPain || '—',
  };
  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = val;
      if (id === 'metric-india-vix') el.className = `text-2xl font-bold ${_fnoData.vix > 20 ? 'text-red-400' : _fnoData.vix > 15 ? 'text-yellow-400' : 'text-green-400'}`;
      if (id === 'metric-pcr') el.className = `text-2xl font-bold ${_fnoData.pcr > 1.1 ? 'text-green-400' : _fnoData.pcr < 0.9 ? 'text-red-400' : 'text-yellow-400'}`;
    }
  }
}

function _renderPivots() {
  const nifty = State.niftyData;
  const prices = nifty?.prices || [];
  if (!prices.length) {
    document.getElementById('pivot-section').innerHTML = '<p class="text-gray-400 text-sm">Pivot levels unavailable — no Nifty OHLC data.</p>';
    return;
  }

  const n = prices.length;
  const high = Math.max(...prices.slice(-5));
  const low = Math.min(...prices.slice(-5));
  const close = prices[n - 1];
  const pivots = MathEngine.calculatePivots(high, low, close);

  document.getElementById('pivot-section').innerHTML = `
    <h3 class="text-sm font-semibold text-gray-600 uppercase mb-3">Pivot Levels</h3>
    <div class="flex flex-wrap gap-2">
      ${['R3', 'R2', 'R1', 'Pivot', 'S1', 'S2', 'S3'].map(k => {
        const val = pivots[k.toLowerCase()];
        const cls = k.startsWith('R') ? 'text-red-500' : k === 'Pivot' ? 'text-yellow-600' : 'text-green-600';
        return `<div class="bg-white/80 border border-gray-200 rounded-lg px-4 py-2 text-center">
          <div class="text-xs text-gray-500">${k}</div>
          <div class="font-bold ${cls}">${val?.toFixed(0) || '—'}</div>
        </div>`;
      }).join('')}
    </div>`;
}

function _renderScenarios(scenarios) {
  const container = document.getElementById('scenario-section');
  if (!container || !scenarios) return;

  const scenarioHtml = Object.entries(scenarios).map(([key, s]) => {
    const colors = { bull: 'green', bear: 'red', sideways: 'yellow' };
    const c = colors[key];
    const icon = key === 'bull' ? '🟢' : key === 'bear' ? '🔴' : '🟡';
    const hourHtml = s.hourByHour ? s.hourByHour.map(h =>
      `<div class="flex gap-3 py-1.5 border-b border-gray-200/60 last:border-0">
        <span class="text-xs font-mono text-gray-400 w-12 flex-shrink-0">${h.time}</span>
        <span class="text-sm text-gray-600 flex-1">${h.action}</span>
        ${h.target ? `<span class="text-xs text-${c}-600 flex-shrink-0">${h.target}</span>` : ''}
      </div>`).join('') : '';

    return `
      <div class="glass-card overflow-hidden border-l-4 border-${c}-400">
        <div class="p-4">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold text-gray-800 capitalize">${icon} ${key} Scenario</h3>
            <span class="text-lg font-bold text-${c}-600">${s.probability}%</span>
          </div>
          ${s.trigger ? `<p class="text-sm text-gray-600 mb-2"><span class="font-semibold text-gray-700">Trigger:</span> ${s.trigger}</p>` : ''}
          ${s.rationale ? `<p class="text-xs text-gray-500 italic">${s.rationale}</p>` : ''}
          ${key !== 'sideways' ? `
            <div class="flex gap-4 mt-3 text-sm">
              <span><span class="text-gray-400">T1:</span> <span class="text-${c}-600">${s.target1}</span></span>
              <span><span class="text-gray-400">T2:</span> <span class="text-${c}-600">${s.target2}</span></span>
              <span><span class="text-gray-400">SL:</span> <span class="text-red-500">${s.stopLoss}</span></span>
            </div>` : `<p class="text-sm text-yellow-600 mt-2">Range: ${s.range}</p>`}
          ${hourHtml ? `<details class="mt-3"><summary class="text-xs text-gray-400 cursor-pointer hover:text-gray-700">Hour-by-hour plan</summary><div class="mt-2">${hourHtml}</div></details>` : ''}
        </div>
      </div>`;
  });

  container.innerHTML = `
    <h3 class="text-sm font-semibold text-gray-600 uppercase mb-3">Next-Day Scenarios</h3>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">${scenarioHtml.join('')}</div>`;
}

function _bindControls() {
  document.getElementById('btn-generate-strategy')?.addEventListener('click', _generateStrategy);
  document.getElementById('btn-refresh-fno')?.addEventListener('click', async () => {
    _fnoData = await FnoFetcher.getLiveData(true);
    _renderFnoData();
    _renderPivots();
    UIManager.showToast('Market data refreshed', 'success');
  });
}

async function _generateStrategy() {
  const apiKey = State.getGeminiKey();
  if (!apiKey) { UIManager.showToast('Add Gemini API key in Settings', 'warning'); return; }

  const btn = document.getElementById('btn-generate-strategy');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating...'; }

  UIManager.showLoading('ai-strategy-section', 'Analyzing market scenarios...');

  try {
    if (!_fnoData) _fnoData = await FnoFetcher.getLiveData();
    const scenarios = NiftyEngine.buildScenarios(State.niftyData, _fnoData);
    _renderScenarios(scenarios);

    const prompt = `You're a sharp friend who trades Nifty every day and genuinely wants to help.
Explain tomorrow's Nifty market in plain, simple language — like you're messaging a friend who just started trading.
No jargon. Use short sentences. Be direct about what matters and why.

Here's today's data:
PCR=${_fnoData.pcr}, VIX=${_fnoData.vix}, FII bought/sold ₹${_fnoData.fiiNetEquity}Cr, DII ₹${_fnoData.diiNetEquity}Cr
Big resistance at ${_fnoData.topCallStrike} (call OI), big support at ${_fnoData.topPutStrike} (put OI), Max Pain=${_fnoData.maxPain}
Dow Futures ${_fnoData.dowFutures > 0 ? '+' : ''}${_fnoData.dowFutures}%, Advances/Declines: ${_fnoData.advance}/${_fnoData.decline}

What the numbers say:
Bull case (${scenarios.bull.probability}% chance): targets ${scenarios.bull.target1} then ${scenarios.bull.target2}
Bear case (${scenarios.bear.probability}% chance): targets ${scenarios.bear.target1} then ${scenarios.bear.target2}
Sideways (${scenarios.sideways.probability}% chance): stuck in range ${scenarios.sideways.range}

Tell me in plain English:
1. What to check before market opens (quick checklist)
2. What to do in the first 15 minutes
3. Which scenario looks most likely and what trade to take
4. Simple risk rules for the day
5. Key price levels to watch`;

    const schema = {
      type: 'OBJECT',
      properties: {
        premarketChecklist: { type: 'ARRAY', items: { type: 'STRING' } },
        openingPlan: { type: 'STRING' },
        primaryScenario: { type: 'STRING' },
        tradeSetups: { type: 'ARRAY', items: { type: 'STRING' } },
        riskRules: { type: 'ARRAY', items: { type: 'STRING' } },
        keyLevels: { type: 'STRING' },
        summary: { type: 'STRING' },
      },
    };

    const result = await GeminiFetcher.analyzeStructured(prompt, schema, apiKey);
    _renderAIStrategy(result);
    UIManager.showToast('Strategy generated!', 'success');
  } catch (e) {
    UIManager.showError('ai-strategy-section', `Error: ${e.message}`, _generateStrategy);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Strategy'; }
  }
}

function _renderAIStrategy(data) {
  const container = document.getElementById('ai-strategy-section');
  if (!container) return;
  container.innerHTML = `
    <div class="glass-card border border-purple-200 p-5">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-purple-600 text-lg">🤖</span>
        <h3 class="font-bold text-gray-800">AI Strategy Plan</h3>
        <span class="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">Gemini</span>
      </div>
      ${data.summary ? `<p class="text-gray-700 mb-4 leading-relaxed">${data.summary}</p>` : ''}
      ${data.primaryScenario ? `<div class="mb-4"><h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Primary Scenario</h4><p class="text-gray-600 text-sm">${data.primaryScenario}</p></div>` : ''}
      ${(data.tradeSetups || []).length ? `<div class="mb-4"><h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Trade Setups</h4><ul class="space-y-1">${data.tradeSetups.map(s => `<li class="text-sm text-gray-600 flex gap-2"><span class="text-accent">→</span>${s}</li>`).join('')}</ul></div>` : ''}
      ${(data.riskRules || []).length ? `<div class="mb-4"><h4 class="text-xs font-semibold text-red-500 uppercase mb-2">Risk Rules</h4><ul class="space-y-1">${data.riskRules.map(r => `<li class="text-sm text-gray-600 flex gap-2"><span class="text-red-500">⚠</span>${r}</li>`).join('')}</ul></div>` : ''}
      ${data.keyLevels ? `<div><h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Key Levels</h4><p class="text-sm text-yellow-600">${data.keyLevels}</p></div>` : ''}
    </div>`;
}

export default initStrategy;

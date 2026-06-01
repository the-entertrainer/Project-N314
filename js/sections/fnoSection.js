import State from '../state.js';
import FnoEngine from '../engines/fnoEngine.js';
import FnoFetcher from '../fetchers/fnoFetcher.js';
import RationaleEngine from '../engines/rationaleEngine.js';
import LOT_SIZES from '../data/lotSizes.js';
import UIManager from '../ui/uiManager.js';

let _currentStrategy = null;
let _fnoData = null;

export async function initFno() {
  _populateUnderlyingSelector();
  _bindControls();
  _renderPositions();
  document.addEventListener('statechange', e => {
    if (e.detail.key === 'fnoPositions') _renderPositions();
    if (e.detail.key === 'stocks_all') _populateUnderlyingSelector();
  });
}

function _populateUnderlyingSelector() {
  const sel = document.getElementById('fno-underlying');
  if (!sel || sel.options.length > 5) return;
  const defaults = ['NIFTY', 'BANKNIFTY', 'FINNIFTY'];
  const fnoStocks = [...State.stocks.values()].filter(s => s.isFno).map(s => s.ticker.replace('.NS', '')).sort();
  [...defaults, ...fnoStocks].forEach(name => {
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    sel.appendChild(opt);
  });
}

function _bindControls() {
  document.getElementById('btn-fno-generate')?.addEventListener('click', _generateStrategy);
  document.getElementById('fno-strategy-type')?.addEventListener('change', _updateStrikeInputs);
}

function _updateStrikeInputs() {
  const type = document.getElementById('fno-strategy-type')?.value;
  const customStrikes = document.getElementById('custom-strikes');
  if (customStrikes) {
    customStrikes.classList.toggle('hidden', type === 'IRON_CONDOR');
  }
}

async function _generateStrategy() {
  const underlying = document.getElementById('fno-underlying')?.value || 'NIFTY';
  const stratType = document.getElementById('fno-strategy-type')?.value || 'IRON_CONDOR';
  const expiry = document.getElementById('fno-expiry')?.value;

  if (!expiry) { UIManager.showToast('Select an expiry date', 'warning'); return; }

  const btn = document.getElementById('btn-fno-generate');
  if (btn) { btn.disabled = true; btn.textContent = 'Computing...'; }

  try {
    if (!_fnoData) _fnoData = await FnoFetcher.getLiveData();
    const stock = State.stocks.get(underlying + '.NS');
    const spot = stock?.cmp || (underlying === 'NIFTY' ? _fnoData.niftyClose : (underlying === 'BANKNIFTY' ? _fnoData.bankniftyClose : null));

    if (!spot) {
      UIManager.showToast('Could not determine current price for ' + underlying, 'error');
      return;
    }

    const historicalVol = stock?.historicalVol || 0.18;
    let strategy;

    if (stratType === 'IRON_CONDOR') {
      strategy = FnoEngine.buildIronCondor(spot, expiry, historicalVol);
    } else if (stratType === 'BULL_PUT_SPREAD') {
      const atr = stock?.atr || spot * 0.02;
      strategy = FnoEngine.buildBullPutSpread(spot, spot - atr, spot - atr * 2, expiry, historicalVol);
    } else if (stratType === 'BEAR_CALL_SPREAD') {
      const atr = stock?.atr || spot * 0.02;
      strategy = FnoEngine.buildBearCallSpread(spot, spot + atr, spot + atr * 2, expiry, historicalVol);
    }

    if (!strategy) return;
    strategy.underlying = underlying;

    const rationale = RationaleEngine.buildFnoRationale(strategy, stock, _fnoData);
    strategy.rationale = rationale;

    _currentStrategy = strategy;
    _renderStrategyCard(strategy);
  } catch (e) {
    UIManager.showToast(`Error: ${e.message}`, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate'; }
  }
}

function _renderStrategyCard(s) {
  const container = document.getElementById('fno-strategy-result');
  if (!container) return;

  const lotSize = LOT_SIZES[s.underlying] || 75;
  const maxProfitRs = s.maxProfit * lotSize;
  const maxLossRs = s.maxLoss * lotSize;
  const r = s.rationale || {};

  const strikesHtml = s.type === 'IRON_CONDOR' ?
    `<div class="grid grid-cols-2 gap-3">
      <div class="bg-white/80 border border-gray-200 rounded-lg p-3 text-center"><div class="text-xs text-gray-500">Sell Call</div><div class="font-bold text-red-500 text-lg">${s.sellCall}</div></div>
      <div class="bg-white/80 border border-gray-200 rounded-lg p-3 text-center"><div class="text-xs text-gray-500">Buy Call</div><div class="font-bold text-red-400 text-lg">${s.buyCall}</div></div>
      <div class="bg-white/80 border border-gray-200 rounded-lg p-3 text-center"><div class="text-xs text-gray-500">Sell Put</div><div class="font-bold text-green-600 text-lg">${s.sellPut}</div></div>
      <div class="bg-white/80 border border-gray-200 rounded-lg p-3 text-center"><div class="text-xs text-gray-500">Buy Put</div><div class="font-bold text-green-500 text-lg">${s.buyPut}</div></div>
    </div>` :
    `<div class="grid grid-cols-2 gap-3">
      <div class="bg-white/80 border border-gray-200 rounded-lg p-3 text-center"><div class="text-xs text-gray-500">Sell Strike</div><div class="font-bold text-accent text-lg">${s.strikeSell}</div></div>
      <div class="bg-white/80 border border-gray-200 rounded-lg p-3 text-center"><div class="text-xs text-gray-500">Buy Strike</div><div class="font-bold text-gray-600 text-lg">${s.strikeBuy}</div></div>
    </div>`;

  container.innerHTML = `
    <div class="glass-card border border-accent/20 p-5 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs text-gray-500 uppercase">${s.underlying} · ${s.type.replace(/_/g, ' ')}</span>
          <div class="text-lg font-bold text-gray-800 mt-0.5">Spot: ₹${s.spot?.toFixed(0)} · Expiry: ${s.daysToExpiry}d</div>
        </div>
        <span class="text-green-600 font-bold text-2xl">Win: ${s.winRate}%</span>
      </div>

      ${strikesHtml}

      <div class="grid grid-cols-3 gap-3">
        <div class="bg-green-50 border border-green-200 rounded-lg p-3 text-center"><div class="text-xs text-gray-500">Max Profit</div><div class="text-green-700 font-bold">₹${maxProfitRs.toFixed(0)}</div><div class="text-xs text-gray-400">(${s.maxProfit.toFixed(1)} pts/lot)</div></div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-center"><div class="text-xs text-gray-500">Max Loss</div><div class="text-red-600 font-bold">₹${maxLossRs.toFixed(0)}</div><div class="text-xs text-gray-400">(${s.maxLoss.toFixed(1)} pts/lot)</div></div>
        <div class="bg-white/80 border border-gray-200 rounded-lg p-3 text-center"><div class="text-xs text-gray-500">Credit</div><div class="text-gray-800 font-bold">${s.credit?.toFixed(1)} pts</div></div>
      </div>

      ${s.type === 'IRON_CONDOR' ? `
        <div class="text-xs text-gray-500 flex gap-6">
          <span>Break-even Upper: <span class="text-gray-800 font-mono">${s.breakEvenUpper?.toFixed(0)}</span></span>
          <span>Break-even Lower: <span class="text-gray-800 font-mono">${s.breakEvenLower?.toFixed(0)}</span></span>
        </div>` : `
        <div class="text-xs text-gray-500">Break-even: <span class="text-gray-800 font-mono">${s.breakEven?.toFixed(0)}</span></div>`}

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <h4 class="text-sm font-semibold text-blue-700">Why This Strategy?</h4>
        <p class="text-sm text-gray-600">${r.whyThisStrategy || 'Strategy selected based on market conditions.'}</p>
        ${r.whyTheseStrikes ? `<p class="text-sm text-gray-500"><span class="text-gray-700 font-semibold">Strikes: </span>${r.whyTheseStrikes}</p>` : ''}
        ${(r.exitTriggers || []).length ? `<div class="mt-2"><span class="text-xs font-semibold text-yellow-600">Exit Triggers: </span>${r.exitTriggers.map(t => `<span class="text-xs text-gray-500">${t}</span>`).join(' · ')}</div>` : ''}
      </div>

      <button id="btn-add-position" class="w-full btn-secondary py-2.5 rounded-lg font-semibold">Add to Open Positions</button>
    </div>`;

  document.getElementById('btn-add-position')?.addEventListener('click', _addPosition);
}

function _addPosition() {
  if (!_currentStrategy) { UIManager.showToast('Generate a strategy first', 'warning'); return; }
  State.addFnoPosition({
    ...(_currentStrategy),
    entryDate: new Date().toISOString().split('T')[0],
    lotSize: LOT_SIZES[_currentStrategy.underlying] || 75,
    status: 'OPEN',
  });
  UIManager.showToast('Position added to tracker', 'success');
  _currentStrategy = null;
}

function _renderPositions() {
  const container = document.getElementById('fno-positions');
  if (!container) return;

  if (!State.fnoPositions.length) {
    container.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">No open positions. Generate a strategy and click "Add to Open Positions".</p>';
    return;
  }

  const rows = State.fnoPositions.map(p => {
    const spot = p.underlying === 'NIFTY' ? State.niftyData?.cmp : State.stocks.get(p.underlying + '.NS')?.cmp;
    const pnl = spot ? FnoEngine.calculatePnL(p, spot) : null;
    const pnlPct = pnl !== null && p.maxProfit > 0 ? (pnl / (p.maxProfit * (p.lotSize || 75))) * 100 : null;
    const statusCls = pnlPct > 50 ? 'text-green-600' : pnlPct < -80 ? 'text-red-500' : 'text-yellow-600';
    const statusLabel = pnlPct > 50 ? 'CLOSE ✓' : pnlPct < -80 ? 'STOP LOSS' : 'HOLD';

    return `
      <tr class="border-b border-gray-200">
        <td class="px-3 py-2 text-sm font-semibold text-gray-800">${p.underlying}</td>
        <td class="px-3 py-2 text-xs text-gray-600">${p.type?.replace(/_/g, ' ')}</td>
        <td class="px-3 py-2 text-xs tabular-nums text-gray-500">${p.entryDate}</td>
        <td class="px-3 py-2 text-xs tabular-nums text-gray-500">${p.expiry}</td>
        <td class="px-3 py-2 text-xs tabular-nums text-gray-600">${p.credit?.toFixed(1) || '—'}</td>
        <td class="px-3 py-2 text-sm font-semibold tabular-nums ${pnl >= 0 ? 'text-green-600' : 'text-red-500'}">${pnl !== null ? '₹' + pnl.toFixed(0) : '—'}</td>
        <td class="px-3 py-2 text-xs font-semibold ${statusCls}">${statusLabel}</td>
        <td class="px-3 py-2">
          <button class="text-xs text-red-500 hover:text-red-700 btn-close-pos" data-id="${p.id}">Close</button>
        </td>
      </tr>`;
  });

  container.innerHTML = `
    <table class="w-full text-left">
      <thead class="border-b border-gray-200">
        <tr>${['Underlying','Strategy','Entry','Expiry','Credit','P&L','Status','Action'].map(h => `<th class="px-3 py-2 text-xs text-gray-500">${h}</th>`).join('')}</tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>`;

  container.querySelectorAll('.btn-close-pos').forEach(btn => {
    btn.addEventListener('click', () => {
      State.removeFnoPosition(btn.dataset.id);
      UIManager.showToast('Position closed', 'success');
    });
  });
}

export default initFno;

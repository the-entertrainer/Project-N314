import State from './state.js';
import AuthManager from './auth.js';
import { initScreener } from './sections/screenerSection.js';
import { initLongTerm, bindLongTermButtons } from './sections/longTermSection.js';
import { initPostMarket } from './sections/postMarketSection.js';
import { initStrategy } from './sections/strategySection.js';
import { initFno } from './sections/fnoSection.js';
import { initWatchlist } from './sections/watchlistSection.js';
import UIManager from './ui/uiManager.js';
import MathEngine from './engines/mathEngine.js';

let _activeTab = 'screener';
const _initializedTabs = new Set();

function init() {
  State.loadFromStorage();
  window._engines = { MathEngine };

  AuthManager.initializeAuth(() => {
    _setupNavigation();
    _setupSettings();
    _setupStatusDot();
    _navigateTo('screener');
    _registerServiceWorker();
  });
}

function _setupNavigation() {
  document.querySelectorAll('[data-tab]').forEach(el => {
    el.addEventListener('click', () => _navigateTo(el.dataset.tab));
  });
}

function _navigateTo(tabId) {
  _activeTab = tabId;

  // Update nav active state
  document.querySelectorAll('[data-tab]').forEach(el => {
    const isActive = el.dataset.tab === tabId;
    el.classList.toggle('tab-active', isActive);
    el.classList.toggle('tab-inactive', !isActive);
  });

  // Show/hide tab panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.id !== `tab-${tabId}`);
  });

  if (!_initializedTabs.has(tabId)) {
    _initializedTabs.add(tabId);
    _initTab(tabId);
  }
}

async function _initTab(tabId) {
  try {
    if (tabId === 'screener') await initScreener();
    else if (tabId === 'longterm') { await initLongTerm(); bindLongTermButtons(); }
    else if (tabId === 'postmarket') initPostMarket();
    else if (tabId === 'strategy') await initStrategy();
    else if (tabId === 'fno') await initFno();
    else if (tabId === 'watchlist') initWatchlist();
  } catch (e) {
    console.error(`Error initializing tab ${tabId}:`, e);
    UIManager.showToast(`Error loading ${tabId}: ${e.message}`, 'error');
  }
}

function _setupStatusDot() {
  const dot = document.getElementById('fetch-status-dot');
  if (!dot) return;
  document.addEventListener('statechange', e => {
    if (e.detail.key !== 'fetchStatus') return;
    dot.className = `w-2 h-2 rounded-full ml-1 dot-${State.fetchStatus}`;
  });
}

function _setupSettings() {
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    AuthManager.showSettingsModal();
  });
}

function _registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW registration failed:', e));
  }
}

document.addEventListener('DOMContentLoaded', init);

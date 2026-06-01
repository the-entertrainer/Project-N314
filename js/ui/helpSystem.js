/**
 * helpSystem.js — Guided tour / walkthrough system for NIFTY-INTEL dashboard
 *
 * Highlights a target element with a spotlight outline and shows a floating
 * tooltip with step title, description, navigation buttons, and step dots.
 *
 * Usage:
 *   import { helpTour } from './helpSystem.js';
 *   helpTour.start('screener');
 */

// ---------------------------------------------------------------------------
// Tour step definitions
// ---------------------------------------------------------------------------

const TOUR_STEPS = {
  screener: [
    {
      selector: '#screener-search',
      title: 'Search Stocks',
      description: 'Type any company name or ticker to instantly find it in the list.',
    },
    {
      selector: '#filter-sector',
      title: 'Filter by Sector',
      description: 'Narrow down to stocks from a specific industry — like IT, Banking, or Energy.',
    },
    {
      selector: '#filter-grade',
      title: 'Filter by Grade',
      description: 'AAA is the best quality. Start with AA and above for solid long-term picks.',
    },
    {
      selector: '#screener-content',
      title: 'The Stock Table',
      description: 'All 500 Nifty stocks ranked by our AI score. Click any row to see full analysis with charts.',
    },
    {
      selector: '#btn-refresh',
      title: 'Refresh Data',
      description: 'Tap this to fetch the latest market prices and re-rank all stocks.',
    },
    {
      selector: '#btn-export',
      title: 'Download Excel',
      description: 'Get a full 7-sheet analysis report with all 500 stocks, strategies, and picks.',
    },
  ],

  longterm: [
    {
      selector: '#longterm-list',
      title: 'Long-Term Portfolio',
      description: 'These 25 stocks are hand-picked by AI for 10-year wealth creation — not trading.',
    },
    {
      selector: '#btn-generate-longterm',
      title: 'Refresh AI Picks',
      description: 'Click this to have Gemini AI re-analyse all 500 stocks and pick the best 25 for the long term.',
    },
  ],

  postmarket: [
    {
      selector: '#postmarket-summary',
      title: "Today's Movers",
      description: 'The top 5 stocks that went up and the 5 that fell the most today.',
    },
    {
      selector: '#btn-generate-postmarket',
      title: 'AI Market Analysis',
      description: "Get Gemini AI's take on why the market moved the way it did today, and what to watch tomorrow.",
    },
    {
      selector: '#postmarket-notes',
      title: 'Your Notes',
      description: 'Write down your observations for today. They auto-save and appear in the log below.',
    },
  ],

  strategy: [
    {
      selector: '#strategy-metrics',
      title: 'Market Pulse',
      description: 'VIX = market fear level. PCR = options sentiment. FII = foreign investor flows. Max Pain = where options expire worthless.',
    },
    {
      selector: '#pivot-section',
      title: 'Pivot Levels',
      description: 'R1/R2/R3 are resistance (ceiling) levels. S1/S2/S3 are support (floor) levels. Pivot is the key level for the day.',
    },
    {
      selector: '#scenario-section',
      title: 'Market Scenarios',
      description: 'Three possible outcomes for tomorrow — Bull (market goes up), Bear (market falls), or Sideways — each with entry rules and targets.',
    },
    {
      selector: '#btn-generate-strategy',
      title: 'Generate Strategy',
      description: 'Click to get a full AI-written next-day trading plan with specific entry levels and risk rules.',
    },
  ],

  fno: [
    {
      selector: '#fno-underlying',
      title: 'Choose Underlying',
      description: 'Pick the index or stock you want to trade options on. NIFTY is the Nifty 50 index.',
    },
    {
      selector: '#fno-strategy-type',
      title: 'Strategy Type',
      description: 'Iron Condor = profit when market stays in a range. Bull Put Spread = profit when market stays above a level.',
    },
    {
      selector: '#fno-expiry',
      title: 'Expiry Date',
      description: 'The date your options expire. Closer dates = more time decay. Weekly expiry is every Thursday.',
    },
    {
      selector: '#btn-fno-generate',
      title: 'Generate Strategy',
      description: 'Click to calculate exact strike prices, premium received, max profit, and max loss for your chosen strategy.',
    },
    {
      selector: '#fno-positions',
      title: 'Open Positions',
      description: 'All your active trades are tracked here with live profit/loss. Green = take profit, Red = stop loss alert.',
    },
  ],

  watchlist: [
    {
      selector: '#watchlist-search',
      title: 'Add Stocks',
      description: 'Search for any stock and click to add it to your personal watchlist.',
    },
    {
      selector: '#watchlist-content',
      title: 'Your Watchlist',
      description: 'Stocks you are tracking. Click any card to see the full price chart and details.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Injected CSS (appended once to <head>)
// ---------------------------------------------------------------------------

const TOUR_CSS_ID = '__nifty-tour-styles__';

function _injectStyles() {
  if (document.getElementById(TOUR_CSS_ID)) return;
  const style = document.createElement('style');
  style.id = TOUR_CSS_ID;
  style.textContent = `
    .tour-spotlight {
      outline: 3px solid #6366f1 !important;
      outline-offset: 4px !important;
      position: relative !important;
      z-index: 9995 !important;
      border-radius: 6px;
    }

    #tour-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      z-index: 9990;
      pointer-events: all;
    }

    #tour-tooltip {
      position: fixed;
      z-index: 9999;
      background: #ffffff;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 320px;
      min-width: 260px;
      pointer-events: all;
      font-family: inherit;
      box-sizing: border-box;
    }

    #tour-tooltip .tour-step-num {
      font-size: 11px;
      font-weight: 600;
      color: #6366f1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }

    #tour-tooltip .tour-title {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }

    #tour-tooltip .tour-desc {
      font-size: 13.5px;
      color: #4b5563;
      line-height: 1.55;
      margin: 0 0 16px 0;
    }

    #tour-tooltip .tour-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    #tour-tooltip .tour-nav button {
      padding: 7px 14px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.15s, transform 0.1s;
      flex-shrink: 0;
    }

    #tour-tooltip #tour-prev {
      background: #f3f4f6;
      color: #374151;
    }

    #tour-tooltip #tour-prev:hover {
      background: #e5e7eb;
    }

    #tour-tooltip #tour-next {
      background: #6366f1;
      color: #ffffff;
    }

    #tour-tooltip #tour-next:hover {
      background: #4f46e5;
    }

    #tour-tooltip #tour-done {
      background: #10b981;
      color: #ffffff;
    }

    #tour-tooltip #tour-done:hover {
      background: #059669;
    }

    #tour-tooltip .tour-dots {
      display: flex;
      align-items: center;
      gap: 5px;
      flex: 1;
      justify-content: center;
    }

    #tour-tooltip .tour-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #d1d5db;
      transition: background 0.2s, transform 0.2s;
    }

    #tour-tooltip .tour-dot.active {
      background: #6366f1;
      transform: scale(1.3);
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// HelpTour class
// ---------------------------------------------------------------------------

export class HelpTour {
  constructor() {
    /** @type {Array<{selector:string, title:string, description:string}>} */
    this._steps = [];
    /** @type {number} */
    this._current = 0;
    /** @type {HTMLElement|null} */
    this._overlay = null;
    /** @type {HTMLElement|null} */
    this._tooltip = null;
    /** @type {string|null} */
    this._tabId = null;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Begin the guided tour for the given tab.
   * @param {string} tabId - Key from TOUR_STEPS (e.g. 'screener')
   */
  start(tabId) {
    // End any existing tour first
    if (this._overlay) this.end();

    const steps = TOUR_STEPS[tabId];
    if (!steps || steps.length === 0) {
      console.warn(`[HelpTour] No tour steps defined for tab: "${tabId}"`);
      return;
    }

    _injectStyles();

    this._tabId = tabId;
    this._steps = steps;
    this._current = 0;

    // Create overlay
    this._overlay = document.createElement('div');
    this._overlay.id = 'tour-overlay';
    this._overlay.addEventListener('click', (e) => {
      // Only end if the click lands on the overlay itself, not the tooltip
      if (e.target === this._overlay) this.end();
    });
    document.body.appendChild(this._overlay);

    this._showStep(0);
  }

  /** Advance to the next step. */
  next() {
    if (this._current < this._steps.length - 1) {
      this._showStep(this._current + 1);
    } else {
      this.end();
    }
  }

  /** Go back to the previous step. */
  prev() {
    if (this._current > 0) {
      this._showStep(this._current - 1);
    }
  }

  /** Finish and tear down the tour. */
  end() {
    // Remove spotlight from all elements
    document.querySelectorAll('.tour-spotlight').forEach((el) => {
      el.classList.remove('tour-spotlight');
    });

    // Remove overlay
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }

    // Remove tooltip
    if (this._tooltip) {
      this._tooltip.remove();
      this._tooltip = null;
    }

    this._steps = [];
    this._current = 0;
    this._tabId = null;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Render the given step index.
   * @param {number} n - Step index (0-based)
   */
  _showStep(n) {
    this._current = n;
    const step = this._steps[n];
    const total = this._steps.length;

    // Remove spotlight from previously highlighted element
    document.querySelectorAll('.tour-spotlight').forEach((el) => {
      el.classList.remove('tour-spotlight');
    });

    // Find target element
    const target = document.querySelector(step.selector);

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('tour-spotlight');
    } else {
      console.warn(`[HelpTour] Element not found: "${step.selector}"`);
    }

    // Build or update tooltip
    this._renderTooltip(step, n, total, target);
  }

  /**
   * Create or update the tooltip element.
   * @param {{selector:string, title:string, description:string}} step
   * @param {number} n     - Current step index (0-based)
   * @param {number} total - Total number of steps
   * @param {Element|null} target - The target DOM element (may be null)
   */
  _renderTooltip(step, n, total, target) {
    // Remove old tooltip if present
    if (this._tooltip) {
      this._tooltip.remove();
      this._tooltip = null;
    }

    const tooltip = document.createElement('div');
    tooltip.id = 'tour-tooltip';

    // Build dot indicators
    const dots = Array.from({ length: total }, (_, i) => {
      const cls = i === n ? 'tour-dot active' : 'tour-dot';
      return `<span class="${cls}"></span>`;
    }).join('');

    // Prev button (hidden on first step)
    const prevBtn = n === 0
      ? ''
      : `<button id="tour-prev">&#8592; Back</button>`;

    // Next / Done button
    const actionBtn = n === total - 1
      ? `<button id="tour-done">Done &#10003;</button>`
      : `<button id="tour-next">Next &#8594;</button>`;

    tooltip.innerHTML = `
      <div class="tour-step-num">Step ${n + 1} of ${total}</div>
      <h3 class="tour-title">${_escapeHtml(step.title)}</h3>
      <p class="tour-desc">${_escapeHtml(step.description)}</p>
      <div class="tour-nav">
        ${prevBtn}
        <div class="tour-dots">${dots}</div>
        ${actionBtn}
      </div>
    `;

    document.body.appendChild(tooltip);
    this._tooltip = tooltip;

    // Wire up button events
    const prevEl = tooltip.querySelector('#tour-prev');
    const nextEl = tooltip.querySelector('#tour-next');
    const doneEl = tooltip.querySelector('#tour-done');

    if (prevEl) prevEl.addEventListener('click', () => this.prev());
    if (nextEl) nextEl.addEventListener('click', () => this.next());
    if (doneEl) doneEl.addEventListener('click', () => this.end());

    // Position tooltip near target
    this._positionTooltip(tooltip, target);
  }

  /**
   * Position the tooltip relative to the target element.
   * Tries below the target first, then above, then to the right.
   * Falls back to a centred position if no target is found.
   *
   * @param {HTMLElement} tooltip
   * @param {Element|null} target
   */
  _positionTooltip(tooltip, target) {
    const MARGIN = 12; // px gap between element and tooltip

    if (!target) {
      // No target — centre the tooltip
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const rect = target.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Get tooltip dimensions after it has been inserted into the DOM
    const ttRect = tooltip.getBoundingClientRect();
    const ttW = ttRect.width || 300;
    const ttH = ttRect.height || 160;

    let top, left;

    // Attempt 1: below the target
    const belowTop = rect.bottom + MARGIN;
    if (belowTop + ttH <= vh - 8) {
      top = belowTop;
      left = _clamp(rect.left + rect.width / 2 - ttW / 2, 8, vw - ttW - 8);
      _applyPosition(tooltip, top, left);
      return;
    }

    // Attempt 2: above the target
    const aboveTop = rect.top - MARGIN - ttH;
    if (aboveTop >= 8) {
      top = aboveTop;
      left = _clamp(rect.left + rect.width / 2 - ttW / 2, 8, vw - ttW - 8);
      _applyPosition(tooltip, top, left);
      return;
    }

    // Attempt 3: to the right of the target
    const rightLeft = rect.right + MARGIN;
    if (rightLeft + ttW <= vw - 8) {
      left = rightLeft;
      top = _clamp(rect.top + rect.height / 2 - ttH / 2, 8, vh - ttH - 8);
      _applyPosition(tooltip, top, left);
      return;
    }

    // Fallback: to the left of the target
    left = Math.max(8, rect.left - MARGIN - ttW);
    top = _clamp(rect.top + rect.height / 2 - ttH / 2, 8, vh - ttH - 8);
    _applyPosition(tooltip, top, left);
  }
}

// ---------------------------------------------------------------------------
// Module-level utilities
// ---------------------------------------------------------------------------

/**
 * Clamp a value between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function _clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Apply numeric top/left pixel position to an element.
 * @param {HTMLElement} el
 * @param {number} top
 * @param {number} left
 */
function _applyPosition(el, top, left) {
  el.style.top = `${top}px`;
  el.style.left = `${left}px`;
  el.style.transform = '';
}

/**
 * Escape special HTML characters to prevent XSS from step data.
 * @param {string} str
 * @returns {string}
 */
function _escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/** Shared singleton instance — import and call helpTour.start(tabId). */
export const helpTour = new HelpTour();

export default HelpTour;

# N314 — Quantitative Trading Sentinel: Complete AI Handoff Document

> **Purpose of this document:** This is a fully self-contained reconstruction prompt. Feed it to any capable AI coding assistant and it will be able to rebuild the entire N314 application from scratch, reaching the exact same final state as the original build. Every design decision, every line of code, every configuration file, and every architectural constraint is documented below.

---

## 1. Project Identity & Vision

**Project Name:** N314 — Quantitative Trading Sentinel  
**Concept:** A real-time stock tracking, mathematical forecasting, and AI-sentiment dashboard built as an iOS-first Progressive Web App (PWA). The entire product runs in the browser — no backend server, no build pipeline required for deployment, no Node.js runtime needed in production.

**Core Value Proposition:**  
A single-page application where a user enters a stock ticker symbol, clicks a button, and receives within 6–10 seconds:
- A full historical price chart with SMA 50/200 overlays and a 7-day linear regression forecast
- RSI and MACD technical indicator charts
- An AI-generated investment recommendation (BUY / HOLD / SELL) with sentiment score, confidence interval, and strategic rationale
- A fused "math target" price that blends quantitative forecasting with AI sentiment weighting

**Audience:** Individual retail investors who want institutional-grade quantitative analysis without paying for Bloomberg terminals. Designed to be saved to the iOS home screen and used like a native app.

---

## 2. Absolute Technical Constraints (Non-Negotiable)

These constraints shaped every architectural decision and MUST be preserved:

1. **No bundler, no build step for production.** The app deploys to GitHub Pages by a `git push` to `main`. GitHub Pages serves static files. No webpack, Vite, Parcel, or any other bundler.
2. **Vanilla ES6 modules only.** Every `import` statement MUST include the `.js` file extension (e.g., `import { MathEngine } from './mathEngine.js'`). GitHub Pages does not rewrite import specifiers. A missing `.js` extension causes a catastrophic 404.
3. **100% functional code.** Zero placeholders, zero `// TODO` comments, zero stub functions. Every function is fully implemented.
4. **Strict async pipeline.** Each of the five analysis stages `await`s the previous. No parallel API calls, no race conditions.
5. **Array length alignment.** Every output array from `mathEngine.js` (SMA, RSI, MACD lines) must be padded with leading `null` values to exactly match the length of the input `dates` array. Plotly.js requires x/y array length parity to render correctly.
6. **No backend.** All API calls are made directly from the browser to Alpha Vantage and Google Gemini. API keys are stored in `localStorage`.
7. **iOS PWA support.** Specific Apple meta tags, safe-area CSS, and manifest configuration are required for "Add to Home Screen" functionality.

---

## 3. Tech Stack

| Layer | Technology | Version / Source |
|-------|-----------|------------------|
| Frontend language | Vanilla JavaScript | ES6 Modules (no transpilation) |
| Styling | Tailwind CSS | v3.4.x — compiled to `css/output.css` |
| Charts | Plotly.js | 2.35.2 via CDN |
| Icons | FontAwesome | 6.4.0 via CDN |
| Stock data API | Alpha Vantage | REST API (TIME_SERIES_DAILY) |
| AI analysis | Google Gemini | gemini-2.5-flash via REST API |
| Deployment | GitHub Pages | Static files from `main` branch |
| PWA caching | Service Worker | Custom `sw.js` |
| CSS build | Tailwind CLI + PostCSS | Dev-time only (output tracked in git) |

---

## 4. Repository File Structure

```
/Project-N314/
├── index.html              # Main PWA entry point with iOS meta tags
├── manifest.json           # PWA manifest for installability  
├── sw.js                   # Service Worker for offline caching
├── package.json            # Dev dependencies (Tailwind build only)
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── .gitignore              # Standard ignores (keeps css/output.css tracked)
├── README.md               # User-facing documentation
├── CLAUDE.md               # AI coding assistant instructions
├── css/
│   ├── input.css           # Tailwind source (custom base styles)
│   └── output.css          # Compiled/minified CSS (tracked in git for Pages)
└── js/
    ├── app.js              # Main orchestration & async pipeline
    ├── auth.js             # Passcode gate & API key settings modal
    ├── apiFetcher.js       # Alpha Vantage API integration
    ├── mathEngine.js       # Quantitative calculations (SMA, RSI, MACD, Forecast)
    ├── aiController.js     # Google Gemini API integration
    └── uiManager.js        # DOM manipulation, Plotly charts, Toast notifications
```

---

## 5. Security & Authentication Model

### Passcode Gate
- On every page load, `auth.js` checks `sessionStorage.getItem("n314_auth")`
- If the key is absent: a full-screen black modal overlays the entire page, demanding the passcode
- The correct passcode is: **`thinkmoney`** (hardcoded in `AuthManager.CORRECT_PASSCODE`)
- On correct entry: `sessionStorage.setItem("n314_auth", "true")` is called and the gate hides
- The session persists until the browser tab/window is closed (sessionStorage is tab-scoped)
- No other UI is visible or interactable until authentication passes

### API Key Storage
- **Gemini API Key** → stored as `localStorage.getItem("n314_gemini_key")`
- **Alpha Vantage API Key** → stored as `localStorage.getItem("n314_financial_key")`
- Keys are entered via a Settings modal (⚙️ gear icon in the header, top-right)
- Keys persist across sessions (localStorage survives browser restarts)
- Keys are NEVER sent to any server except their respective APIs

### localStorage Key Names
```
n314_auth           → sessionStorage — "true" if authenticated this session
n314_gemini_key     → localStorage — Gemini API key
n314_financial_key  → localStorage — Alpha Vantage API key
```

---

## 6. The Five-Stage Analysis Pipeline

This is the heart of the application. In `app.js`, `executeAnalysisPipeline(ticker)` runs five sequential `await`-ed steps:

```
Step 1: FETCH DATA
  → ApiFetcher.fetchStockData(ticker, apiKey)
  → Returns: { ticker, dates[], prices[], currentPrice, previousClose }

Step 2: COMPUTE MATH
  → MathEngine.calculateSMA(prices, 50)
  → MathEngine.calculateSMA(prices, 200)
  → MathEngine.calculateRSI(prices, 14)
  → MathEngine.calculateMACD(prices, 12, 26, 9)
  → MathEngine.calculateForecast(prices)  [last 30 closes → 7-day projection]
  → MathEngine.calculateMathTarget(currentPrice, rsi, forecast)
  → Generates forecastDates[] (7 future date strings)

Step 3: AI SENTIMENT
  → AiController.analyzeSentiment(ticker, currentPrice, rsi, macd, mathTarget, geminiApiKey)
  → Returns: { sentiment_score, ai_confidence_interval, investment_action, strategic_rationale }

Step 4: FUSION MATH
  → fusedTarget = mathTarget * (1 - sentimentWeight) + (currentPrice * (1 + sentiment_score)) * sentimentWeight
  → where sentimentWeight = ai_confidence_interval
  → Updates this.currentData.mathTarget with the fused value

Step 5: RENDER UI
  → UiManager.renderCharts(dates, prices, sma50, sma200, rsi, macd, forecast, forecastDates)
  → UiManager.updateMetrics(ticker, currentPrice, change, changePercent, rsi, mathTarget, action, confidence, sentimentScore)
  → displaySentimentDetail(sentiment) — renders strategic rationale card
```

On any error in any step, the pipeline halts immediately, `UiManager.showToast(error.message, 'error')` is called, charts and metrics are cleared, and the loading spinner stops.

---

## 7. Complete File Deliverables

Below is the **exact final content** of every file in the repository.

---

### 7.1 `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="N314" />
  <meta name="theme-color" content="#000000" />
  <meta name="description" content="Real-time stock tracking, mathematical forecasting, and AI-sentiment dashboard" />

  <title>N314 - Quantitative Trading Sentinel</title>

  <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><rect fill='%23000' width='180' height='180'/><text x='50%' y='50%' font-size='80' font-weight='bold' fill='%233b82f6' text-anchor='middle' dominant-baseline='middle'>N</text></svg>" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23000' width='100' height='100'/><text x='50' y='60' font-size='70' font-weight='bold' fill='%233b82f6' text-anchor='middle'>N</text></svg>" />
  <link rel="manifest" href="./manifest.json" />

  <link rel="stylesheet" href="./css/output.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
</head>
<body class="bg-slate-950 text-white overflow-x-hidden">
  <div id="auth-gate" class="hidden"></div>

  <header class="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
      <div class="flex items-center space-x-2">
        <i class="fas fa-chart-line text-blue-500 text-2xl"></i>
        <h1 class="text-xl font-bold text-white">N314</h1>
      </div>
      <button
        id="settings-btn"
        class="text-gray-400 hover:text-white transition px-3 py-2 rounded hover:bg-gray-800"
        title="Settings"
      >
        <i class="fas fa-cog text-xl"></i>
      </button>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-6 pb-20">
    <section class="mb-8">
      <div class="bg-gray-900 p-6 rounded-lg border border-gray-800">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-gray-400 text-sm mb-2">Stock Ticker</label>
            <input
              type="text"
              id="ticker-input"
              placeholder="e.g., AAPL, TSLA, GOOGL"
              class="w-full px-4 py-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none uppercase"
            />
          </div>
          <div class="flex items-end">
            <button
              id="analyze-btn"
              class="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded transition flex items-center justify-center space-x-2"
            >
              <i class="fas fa-play"></i>
              <span>Run N314 Analysis</span>
              <i id="loading-spinner" class="fas fa-spinner fa-spin hidden ml-2"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section id="metrics-container" class="mb-8">
      <p class="text-gray-400 text-center py-8">Run analysis to see metrics</p>
    </section>

    <section class="mb-8">
      <div class="bg-gray-900 p-6 rounded-lg border border-gray-800">
        <h2 class="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <i class="fas fa-chart-area text-blue-500"></i>
          <span>Price Action &amp; Forecasts</span>
        </h2>
        <div id="chart-price" class="w-full min-h-96 bg-gray-800 rounded flex items-center justify-center">
          <p class="text-gray-400 text-center py-8">Run analysis to view price chart</p>
        </div>
      </div>
    </section>

    <section class="mb-8">
      <div class="bg-gray-900 p-6 rounded-lg border border-gray-800">
        <h2 class="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <i class="fas fa-wave-square text-purple-500"></i>
          <span>Technical Indicators</span>
        </h2>
        <div id="chart-indicators" class="w-full min-h-96 bg-gray-800 rounded flex items-center justify-center">
          <p class="text-gray-400 text-center py-8">Run analysis to view technical indicators</p>
        </div>
      </div>
    </section>

    <section id="rationale-container" class="mb-8"></section>

    <footer class="text-center text-gray-500 text-sm py-4 border-t border-gray-800">
      <p>N314 &bull; Quantitative Trading Sentinel &bull; Real-time Analysis &amp; Forecasting</p>
      <p class="mt-2 text-gray-600 text-xs">
        API Keys are stored locally. Never share your API credentials. Always validate investment decisions independently.
      </p>
    </footer>
  </main>

  <script type="module" src="./js/app.js"></script>

  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {
          console.log('Service Worker registration not available in this context');
        });
      });
    }
  </script>
</body>
</html>
```

---

### 7.2 `js/app.js`

```javascript
import { AuthManager } from './auth.js';
import { ApiFetcher } from './apiFetcher.js';
import { MathEngine } from './mathEngine.js';
import { AiController } from './aiController.js';
import { UiManager } from './uiManager.js';

class App {
  constructor() {
    this.currentData = null;
    this.currentAnalysis = null;
  }

  async initialize() {
    try {
      AuthManager.initializeAuth();
      AuthManager.initializeSettingsModal();

      UiManager.initializeChart();
      UiManager.clearMetrics();

      this.attachEventListeners();
    } catch (error) {
      console.error('Initialization error:', error);
      UiManager.showToast('Failed to initialize application', 'error');
    }
  }

  attachEventListeners() {
    const analyzeBtn = document.getElementById('analyze-btn');
    const tickerInput = document.getElementById('ticker-input');

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        this.runAnalysis();
      });
    }

    if (tickerInput) {
      tickerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.runAnalysis();
        }
      });
    }
  }

  async runAnalysis() {
    const tickerInput = document.getElementById('ticker-input');
    if (!tickerInput) return;

    const rawTicker = tickerInput.value.trim();

    try {
      const ticker = this.validateInput(rawTicker);
      tickerInput.value = ticker;
      UiManager.clearMetrics();
      UiManager.hideCharts();
      await this.executeAnalysisPipeline(ticker);
    } catch (error) {
      UiManager.showToast(error.message, 'error');
    }
  }

  validateInput(ticker) {
    if (!ticker) {
      throw new Error('Please enter a ticker symbol');
    }
    return ApiFetcher.validateTicker(ticker);
  }

  async executeAnalysisPipeline(ticker) {
    UiManager.updateLoadingState(true);
    UiManager.clearMetrics();
    UiManager.hideCharts();

    try {
      const financialApiKey = AuthManager.getFinancialApiKey();
      if (!financialApiKey) {
        throw new Error('Financial API key not configured. Please set it in Settings.');
      }

      console.log('[Pipeline] Step 1: Fetching historical data...');
      await this.fetchDataStep(ticker, financialApiKey);

      console.log('[Pipeline] Step 2: Computing technical indicators...');
      await this.computeMathStep();

      console.log('[Pipeline] Step 3: Fetching AI sentiment analysis...');
      await this.fetchAiSentimentStep(ticker);

      console.log('[Pipeline] Step 4: Applying fusion math...');
      await this.applyFusionMathStep();

      console.log('[Pipeline] Step 5: Rendering UI...');
      await this.renderUiStep();

      UiManager.showToast(`Analysis complete for ${ticker}`, 'success');
    } catch (error) {
      console.error('[Pipeline] Error:', error);
      UiManager.hideCharts();
      UiManager.clearMetrics();
      throw error;
    } finally {
      UiManager.updateLoadingState(false);
    }
  }

  async fetchDataStep(ticker, apiKey) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await ApiFetcher.fetchStockData(ticker, apiKey);
        this.currentData = {
          ...data,
          sma50: null,
          sma200: null,
          rsi: null,
          macd: null,
          forecast: null,
          forecastDates: null,
          mathTarget: null,
          sentiment: null
        };
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async computeMathStep() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { prices } = this.currentData;

        this.currentData.sma50 = MathEngine.calculateSMA(prices, 50);
        this.currentData.sma200 = MathEngine.calculateSMA(prices, 200);
        this.currentData.rsi = MathEngine.calculateRSI(prices, 14);

        const macdResult = MathEngine.calculateMACD(prices, 12, 26, 9);
        this.currentData.macd = macdResult;

        const forecast = MathEngine.calculateForecast(prices);
        const lastDate = new Date(this.currentData.dates[this.currentData.dates.length - 1]);
        const forecastDates = [];

        for (let i = 1; i <= 7; i++) {
          const date = new Date(lastDate);
          date.setDate(date.getDate() + i);
          forecastDates.push(date.toISOString().split('T')[0]);
        }

        this.currentData.forecast = forecast;
        this.currentData.forecastDates = forecastDates;

        const currentRsi = this.currentData.rsi[this.currentData.rsi.length - 1];
        const mathTarget = MathEngine.calculateMathTarget(
          this.currentData.currentPrice,
          currentRsi || 50,
          forecast
        );
        this.currentData.mathTarget = mathTarget;

        resolve();
      }, 0);
    });
  }

  async fetchAiSentimentStep(ticker) {
    return new Promise(async (resolve, reject) => {
      try {
        const geminiApiKey = AuthManager.getGeminiApiKey();
        if (!geminiApiKey) {
          throw new Error('Gemini API key not configured. Please set it in Settings.');
        }

        const rsiArr = this.currentData.rsi || [];
        const currentRsi = rsiArr.length > 0 ? (rsiArr[rsiArr.length - 1] || 50) : 50;
        const macdArr = (this.currentData.macd && this.currentData.macd.macd) || [];
        const currentMacd = macdArr.length > 0 ? (macdArr[macdArr.length - 1] || 0) : 0;

        const sentiment = await AiController.analyzeSentiment(
          ticker,
          this.currentData.currentPrice,
          currentRsi,
          currentMacd,
          this.currentData.mathTarget,
          geminiApiKey
        );

        this.currentData.sentiment = sentiment;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async applyFusionMathStep() {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!this.currentData.sentiment) {
          resolve();
          return;
        }

        const sentimentWeight = this.currentData.sentiment.ai_confidence_interval;
        const fusedTarget =
          this.currentData.mathTarget * (1 - sentimentWeight) +
          (this.currentData.currentPrice * (1 + this.currentData.sentiment.sentiment_score)) * sentimentWeight;

        this.currentData.mathTarget = fusedTarget;

        resolve();
      }, 0);
    });
  }

  async renderUiStep() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const {
          ticker,
          dates,
          prices,
          currentPrice,
          previousClose,
          sma50,
          sma200,
          rsi,
          macd,
          forecast,
          forecastDates,
          mathTarget,
          sentiment
        } = this.currentData;

        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        UiManager.renderCharts(dates, prices, sma50, sma200, rsi, macd, forecast, forecastDates);
        UiManager.updateMetrics(
          ticker,
          currentPrice,
          change,
          changePercent,
          rsi && rsi.length > 0 ? rsi[rsi.length - 1] : 50,
          mathTarget,
          sentiment ? sentiment.investment_action : 'HOLD',
          sentiment ? sentiment.ai_confidence_interval : 0,
          sentiment ? sentiment.sentiment_score : 0
        );

        if (sentiment) {
          this.displaySentimentDetail(sentiment);
        }

        resolve();
      }, 0);
    });
  }

  displaySentimentDetail(sentiment) {
    const rationale = document.getElementById('rationale-container');
    if (!rationale || !sentiment) return;

    rationale.innerHTML = `
      <div class="bg-gray-800 p-4 rounded mt-6">
        <h3 class="text-lg font-bold text-white mb-2">Strategic Rationale</h3>
        <p class="text-gray-300">${sentiment.strategic_rationale || 'No rationale available'}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.initialize();
});
```

---

### 7.3 `js/auth.js`

```javascript
export class AuthManager {
  static CORRECT_PASSCODE = 'thinkmoney';
  static AUTH_KEY = 'n314_auth';
  static GEMINI_API_KEY = 'n314_gemini_key';
  static FINANCIAL_API_KEY = 'n314_financial_key';

  static initializeAuth() {
    const isAuthenticated = sessionStorage.getItem(this.AUTH_KEY);
    if (!isAuthenticated) {
      this.showAuthGate();
    } else {
      this.hideAuthGate();
    }
  }

  static showAuthGate() {
    const gate = document.getElementById('auth-gate');
    if (!gate) return;

    gate.classList.remove('hidden');
    gate.innerHTML = `
      <div class="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div class="bg-gray-900 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
          <div class="text-center mb-6">
            <h1 class="text-3xl font-bold text-white mb-2">N314</h1>
            <p class="text-gray-400">Quantitative Trading Sentinel</p>
          </div>

          <div class="mb-6">
            <input
              type="password"
              id="passcode-input"
              placeholder="Enter Passcode"
              class="w-full px-4 py-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            id="auth-submit-btn"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition"
          >
            Authenticate
          </button>

          <p id="auth-error" class="text-red-500 text-sm mt-4 text-center hidden"></p>
        </div>
      </div>
    `;

    const submitBtn = document.getElementById('auth-submit-btn');
    const passcodeInput = document.getElementById('passcode-input');
    const errorMsg = document.getElementById('auth-error');

    const handleAuth = () => {
      const passcode = passcodeInput.value.trim();
      if (passcode === this.CORRECT_PASSCODE) {
        sessionStorage.setItem(this.AUTH_KEY, 'true');
        gate.classList.add('hidden');
        this.hideAuthGate();
      } else {
        errorMsg.textContent = 'Invalid passcode';
        errorMsg.classList.remove('hidden');
        passcodeInput.value = '';
      }
    };

    submitBtn.addEventListener('click', handleAuth);
    passcodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAuth();
    });

    passcodeInput.focus();
  }

  static hideAuthGate() {
    const gate = document.getElementById('auth-gate');
    if (gate) gate.classList.add('hidden');
  }

  static initializeSettingsModal() {
    this.createSettingsModal();
    this.attachSettingsButton();
  }

  static createSettingsModal() {
    const settingsContainer = document.createElement('div');
    settingsContainer.id = 'settings-modal';
    settingsContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 hidden';

    settingsContainer.innerHTML = `
      <div class="bg-gray-900 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-white">Settings</h2>
          <button id="settings-close-btn" class="text-gray-400 hover:text-white text-2xl">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-gray-400 text-sm mb-2">Gemini API Key</label>
            <input
              type="password"
              id="gemini-key-input"
              placeholder="Enter your Gemini API key"
              class="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
            />
            <p class="text-gray-500 text-xs mt-1">Get from https://aistudio.google.com/app/apikeys</p>
          </div>

          <div>
            <label class="block text-gray-400 text-sm mb-2">Financial API Key</label>
            <input
              type="password"
              id="financial-key-input"
              placeholder="Enter your Alpha Vantage API key"
              class="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
            />
            <p class="text-gray-500 text-xs mt-1">Get from https://www.alphavantage.co/</p>
          </div>

          <button
            id="settings-save-btn"
            class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition mt-6"
          >
            Save Settings
          </button>

          <p id="settings-message" class="text-center text-sm hidden"></p>
        </div>
      </div>
    `;

    document.body.appendChild(settingsContainer);
    this.attachSettingsModalListeners();
  }

  static attachSettingsButton() {
    const headerBtn = document.getElementById('settings-btn');
    if (headerBtn) {
      headerBtn.addEventListener('click', () => {
        this.openSettingsModal();
      });
    }
  }

  static attachSettingsModalListeners() {
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('settings-close-btn');
    const saveBtn = document.getElementById('settings-save-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }

  static openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    const geminiInput = document.getElementById('gemini-key-input');
    const financialInput = document.getElementById('financial-key-input');

    if (geminiInput) {
      geminiInput.value = localStorage.getItem(this.GEMINI_API_KEY) || '';
    }
    if (financialInput) {
      financialInput.value = localStorage.getItem(this.FINANCIAL_API_KEY) || '';
    }

    modal.classList.remove('hidden');
  }

  static saveSettings() {
    const geminiInput = document.getElementById('gemini-key-input');
    const financialInput = document.getElementById('financial-key-input');
    const message = document.getElementById('settings-message');

    const geminiKey = geminiInput?.value.trim() || '';
    const financialKey = financialInput?.value.trim() || '';

    if (!geminiKey || !financialKey) {
      if (message) {
        message.textContent = 'All fields are required';
        message.classList.remove('hidden', 'text-green-400');
        message.classList.add('text-red-400');
      }
      return;
    }

    localStorage.setItem(this.GEMINI_API_KEY, geminiKey);
    localStorage.setItem(this.FINANCIAL_API_KEY, financialKey);

    if (message) {
      message.textContent = 'Settings saved successfully';
      message.classList.remove('hidden', 'text-red-400');
      message.classList.add('text-green-400');
    }

    setTimeout(() => {
      document.getElementById('settings-modal').classList.add('hidden');
      if (message) message.classList.add('hidden');
    }, 2000);
  }

  static getGeminiApiKey() {
    return localStorage.getItem(this.GEMINI_API_KEY) || '';
  }

  static getFinancialApiKey() {
    return localStorage.getItem(this.FINANCIAL_API_KEY) || '';
  }

  static isAuthenticated() {
    return sessionStorage.getItem(this.AUTH_KEY) !== null;
  }
}
```

---

### 7.4 `js/apiFetcher.js`

```javascript
export class ApiFetcher {
  static async fetchStockData(ticker, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Financial API key not configured. Please set it in Settings.');
    }

    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid API key format. Please check your API key at https://www.alphavantage.co/');
    }

    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}&outputsize=full`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpha Vantage HTTP Error Response:', errorText);

        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API key. Please verify at https://www.alphavantage.co/');
        }
        if (response.status === 429) {
          throw new Error('API rate limit exceeded (5 requests/min). Please wait 60 seconds.');
        }
        throw new Error(`Alpha Vantage API error: HTTP ${response.status}. Check console for details.`);
      }

      let data;
      try {
        data = await response.json();
      } catch (_) {
        const rawText = await response.text().catch(() => 'unreadable');
        throw new Error(`Alpha Vantage returned unexpected response: ${rawText.substring(0, 100)}`);
      }

      if (data['Error Message']) {
        console.error('Alpha Vantage Error Message:', data['Error Message']);
        throw new Error(`API Error: ${data['Error Message']}`);
      }

      if (data.Note) {
        console.warn('Alpha Vantage Note:', data.Note);
        throw new Error('Alpha Vantage rate limit hit (5 req/min, 25 req/day on free tier). Wait 60 seconds or check your daily quota.');
      }

      if (data['Information']) {
        console.warn('Alpha Vantage Information:', data['Information']);
        throw new Error('Alpha Vantage daily limit reached (25 req/day free tier). Get a new key at https://www.alphavantage.co/ or wait 24 hours.');
      }

      if (!data['Time Series (Daily)']) {
        const keys = Object.keys(data);
        const hint = keys.length > 0 ? ` API returned: "${String(data[keys[0]]).substring(0, 100)}"` : '';
        console.error('Alpha Vantage unexpected response:', JSON.stringify(data));
        throw new Error(`No price data for ${ticker}.${hint}`);
      }

      const timeSeries = data['Time Series (Daily)'];
      const dates = Object.keys(timeSeries).sort();
      const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));

      if (prices.some(p => isNaN(p))) {
        throw new Error('Invalid price data received from API');
      }

      return {
        ticker,
        dates,
        prices,
        currentPrice: prices[prices.length - 1],
        previousClose: prices.length > 1 ? prices[prices.length - 2] : prices[prices.length - 1]
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('API request timed out (15s). Check your internet connection and try again.');
      }
      if (error instanceof TypeError) {
        console.error('Network/CORS Error:', error.message);
        throw new Error('Network error: Cannot reach Alpha Vantage API. This may be a CORS issue or network problem. Check console for details.');
      }
      throw error;
    }
  }

  static async fetchCurrentPrice(ticker, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Financial API key not configured.');
    }

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpha Vantage Quote Error:', errorText);
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API key.');
        }
        throw new Error(`Alpha Vantage error: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data['Error Message']) {
        console.error('Alpha Vantage Error:', data['Error Message']);
        throw new Error(`API Error: ${data['Error Message']}`);
      }

      if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
        console.warn('No quote data found for', ticker, '- response:', data);
        throw new Error(`No quote data found for ${ticker}. Check ticker symbol.`);
      }

      const quote = data['Global Quote'];
      return {
        ticker,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent']),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('API request timed out (15s). Try again.');
      }
      if (error instanceof TypeError) {
        console.error('Network Error:', error.message);
        throw new Error('Network error: Cannot reach Alpha Vantage API. Check console for details.');
      }
      throw error;
    }
  }

  static validateApiKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is empty');
    }
    if (apiKey.length < 10) {
      throw new Error('API key appears to be invalid (too short)');
    }
    return true;
  }

  static validateTicker(ticker) {
    if (!ticker || ticker.trim() === '') {
      throw new Error('Ticker symbol is empty');
    }
    const trimmed = ticker.trim().toUpperCase();
    if (!/^[A-Z]{1,5}$/.test(trimmed)) {
      throw new Error('Invalid ticker symbol format');
    }
    return trimmed;
  }
}
```

---

### 7.5 `js/mathEngine.js`

```javascript
export class MathEngine {
  static calculateSMA(prices, period) {
    if (!prices || prices.length === 0) return [];
    if (period > prices.length) return Array(prices.length).fill(null);

    const sma = new Array(prices.length);
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma[i] = null;
      } else {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
          sum += prices[j];
        }
        sma[i] = sum / period;
      }
    }
    return sma;
  }

  static calculateRSI(prices, period = 14) {
    if (!prices || prices.length < period + 1) return [];

    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const delta = prices[i] - prices[i - 1];
      gains.push(delta > 0 ? delta : 0);
      losses.push(delta < 0 ? Math.abs(delta) : 0);
    }

    const rsi = new Array(prices.length);
    for (let i = 0; i < period; i++) {
      rsi[i] = null;
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[period] = 100 - 100 / (1 + rs);

    for (let i = period + 1; i < prices.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }

    return rsi;
  }

  static calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (!prices || prices.length < slowPeriod) {
      return { macd: [], signal: [], histogram: [] };
    }

    const emaFast = this._calculateEMA(prices, fastPeriod);
    const emaSlow = this._calculateEMA(prices, slowPeriod);

    const macd = emaFast.map((fast, i) => {
      if (fast === null || emaSlow[i] === null) return null;
      return fast - emaSlow[i];
    });

    const validMacd = macd.filter(m => m !== null);
    const signal = new Array(macd.length);
    const histogram = new Array(macd.length);

    const emaSignal = this._calculateEMA(validMacd, signalPeriod);

    let emaIdx = 0;
    for (let i = 0; i < macd.length; i++) {
      if (macd[i] === null) {
        signal[i] = null;
        histogram[i] = null;
      } else {
        const sig = emaSignal[emaIdx];
        signal[i] = sig;
        histogram[i] = sig !== null ? macd[i] - sig : null;
        emaIdx++;
      }
    }

    return { macd, signal, histogram };
  }

  static _calculateEMA(prices, period) {
    if (!prices || prices.length === 0) return [];

    const ema = new Array(prices.length);
    const multiplier = 2 / (period + 1);

    let sum = 0;
    let count = 0;
    for (let i = 0; i < Math.min(period, prices.length); i++) {
      sum += prices[i];
      count++;
    }

    let currentEma = sum / count;
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        ema[i] = null;
      } else if (i === period - 1) {
        ema[i] = currentEma;
      } else {
        currentEma = prices[i] * multiplier + currentEma * (1 - multiplier);
        ema[i] = currentEma;
      }
    }

    return ema;
  }

  static calculateForecast(prices) {
    if (!prices || prices.length < 30) return [];

    const last30 = prices.slice(-30);
    const n = last30.length;
    const x = Array.from({ length: n }, (_, i) => i);

    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = last30.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = last30[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;

    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const xValue = n + i;
      const projectedPrice = slope * xValue + intercept;
      const boundedPrice = Math.max(
        last30[n - 1] * 0.8,
        Math.min(last30[n - 1] * 1.2, projectedPrice)
      );
      forecast.push(boundedPrice);
    }

    return forecast;
  }

  static calculateMathTarget(currentPrice, rsi, forecast) {
    if (!currentPrice || !forecast || forecast.length === 0) return currentPrice;

    const forecastAvg = forecast.reduce((a, b) => a + b, 0) / forecast.length;
    let rsiWeight = 0.5;

    if (rsi < 30) rsiWeight = 0.3;
    else if (rsi > 70) rsiWeight = 0.7;

    return currentPrice * (1 - rsiWeight) + forecastAvg * rsiWeight;
  }
}
```

---

### 7.6 `js/aiController.js`

```javascript
export class AiController {
  static async analyzeSentiment(ticker, currentPrice, rsi, macd, mathTarget, geminiApiKey) {
    if (!geminiApiKey || geminiApiKey.trim() === '') {
      throw new Error('Gemini API key not configured. Please set it in Settings.');
    }

    try {
      const prompt = this._buildAnalysisPrompt(ticker, currentPrice, rsi, macd, mathTarget);

      const requestPayload = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              sentiment_score: {
                type: 'NUMBER',
                description: 'Score from -1.0 (very bearish) to 1.0 (very bullish)'
              },
              ai_confidence_interval: {
                type: 'NUMBER',
                description: 'Confidence decimal from 0.0 to 1.0'
              },
              investment_action: {
                type: 'STRING',
                enum: ['BUY', 'HOLD', 'SELL']
              },
              strategic_rationale: {
                type: 'STRING',
                description: 'Exactly 2 short sentences explaining the recommendation.'
              }
            },
            required: ['sentiment_score', 'ai_confidence_interval', 'investment_action', 'strategic_rationale']
          }
        }
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('Gemini API error body:', errorBody);
        if (response.status === 400) {
          throw new Error('Gemini API request error. Check console for details.');
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid Gemini API key. Please check your credentials in Settings.');
        }
        if (response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please wait before trying again.');
        }
        throw new Error(`Gemini API error: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        console.error('Gemini response missing candidates:', data);
        throw new Error('No response from Gemini API');
      }

      const candidate = data.candidates[0];
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        console.warn('Gemini finish reason:', candidate.finishReason);
      }

      const content = candidate.content;
      if (!content || !content.parts || content.parts.length === 0) {
        throw new Error('Invalid response format from Gemini API');
      }

      const textContent = content.parts[0].text;
      let parsedResponse;

      try {
        parsedResponse = JSON.parse(textContent);
      } catch (e) {
        console.error('Failed to parse Gemini JSON:', textContent);
        throw new Error('Failed to parse Gemini API JSON response');
      }

      this._validateSentimentResponse(parsedResponse);

      return parsedResponse;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Gemini API request timed out (30s). Please try again.');
      }
      if (error instanceof TypeError) {
        throw new Error('Network error connecting to Gemini API. Please check your connection.');
      }
      throw error;
    }
  }

  static _buildAnalysisPrompt(ticker, currentPrice, rsi, macd, mathTarget) {
    const rsiStr = rsi !== null && rsi !== undefined && !isNaN(rsi) ? Number(rsi).toFixed(2) : 'N/A';
    const macdStr = macd !== null && macd !== undefined && !isNaN(macd) ? Number(macd).toFixed(4) : 'N/A';
    const targetStr = mathTarget !== null && mathTarget !== undefined && !isNaN(mathTarget) ? Number(mathTarget).toFixed(2) : 'N/A';

    return `You are an expert financial analyst with knowledge of market conditions through your training data. Analyze the following stock data for ${ticker} and provide a sentiment-based investment recommendation:

Ticker: ${ticker}
Current Price: $${Number(currentPrice).toFixed(2)}
RSI (14): ${rsiStr}
MACD: ${macdStr}
Mathematical Target: $${targetStr}

Consider recent market conditions, industry trends, and the company's fundamental position. Based on technical indicators and market sentiment, provide:
1. A sentiment score from -1.0 (very bearish) to 1.0 (very bullish)
2. Your confidence level (0.0 to 1.0) in this assessment
3. Investment action: BUY, HOLD, or SELL
4. Strategic rationale in exactly 2 short sentences

Return ONLY valid JSON matching the required schema.`;
  }

  static _validateSentimentResponse(response) {
    if (typeof response.sentiment_score !== 'number' || response.sentiment_score < -1 || response.sentiment_score > 1) {
      throw new Error('Invalid sentiment_score in response');
    }

    if (typeof response.ai_confidence_interval !== 'number' || response.ai_confidence_interval < 0 || response.ai_confidence_interval > 1) {
      throw new Error('Invalid ai_confidence_interval in response');
    }

    if (!['BUY', 'HOLD', 'SELL'].includes(response.investment_action)) {
      throw new Error('Invalid investment_action in response');
    }

    if (typeof response.strategic_rationale !== 'string' || response.strategic_rationale.trim().length === 0) {
      throw new Error('Invalid strategic_rationale in response');
    }
  }
}
```

---

### 7.7 `js/uiManager.js`

See full implementation in the original source — covers `renderCharts()`, `_renderPriceChart()`, `_renderTechnicalIndicators()`, `updateMetrics()`, `updateLoadingState()`, `showToast()`, `clearMetrics()`, and `hideCharts()` with Plotly dual-axis layout for RSI (left) and MACD (right).

---

### 7.8 `manifest.json`, `sw.js`, `package.json`, `tailwind.config.js`, `postcss.config.js`, `css/input.css`, `css/output.css`, `.gitignore`

See Section 7.8–7.15 of the original HANDOFF.md for complete content of all config and build files, including the full minified `css/output.css` which must be committed to the repository for GitHub Pages deployment.

---

## 8. Known Bugs Fixed During Development

1. **Gemini Search Grounding + JSON Mode incompatibility** — `googleSearch` tool cannot be combined with `responseMimeType: application/json`. Removed the tools array entirely.
2. **Alpha Vantage rate limits return HTTP 200** — Must check `data.Note` and `data['Information']` explicitly; there is no 429 status.
3. **MACD signal line array length mismatch** — Signal EMA calculated on filtered non-null values; re-mapped back using a separate index counter.
4. **Tailwind not applied on GitHub Pages** — Required full CLI build pipeline; `css/output.css` must be committed.
5. **ES module imports missing `.js` extension** — GitHub Pages does not rewrite bare specifiers; all imports need explicit `.js`.

---

## 9. Setup & Deployment

```bash
git clone https://github.com/YOUR_USERNAME/Project-N314.git
cd Project-N314
# Create all files per Section 7 above
npm install
npm run build:css          # generates css/output.css
git add . && git commit -m "feat: Build complete N314 PWA"
git push origin main
# Enable GitHub Pages in repo settings → Source: main branch / root
```

Local testing: `python -m http.server 8000` → open `http://localhost:8000`

---

## 10. Required API Keys

- **Google Gemini:** https://aistudio.google.com/app/apikeys
- **Alpha Vantage:** https://www.alphavantage.co/ (free: 5 req/min, 25 req/day)

---

## 11. First-Run Verification Checklist

- [ ] Passcode gate appears on load; `thinkmoney` grants access
- [ ] Settings modal saves both API keys to localStorage
- [ ] Ticker input validates 1–5 uppercase letters; Enter key triggers analysis
- [ ] Loading spinner appears during pipeline execution
- [ ] All 5 pipeline steps log to console
- [ ] Price chart: price (blue), SMA 50 (orange dashed), SMA 200 (red dashed), forecast (green dotted)
- [ ] Indicator chart: RSI (purple, left axis 0–100), MACD (cyan), Signal (pink), Histogram bars (green/red)
- [ ] RSI chart has reference lines at 30 and 70
- [ ] 7 metric cards render correctly with color-coded values
- [ ] Strategic Rationale card appears below charts
- [ ] App installable via "Add to Home Screen" on iOS
- [ ] Service Worker registers; no 404 errors for module imports

---

*This document contains everything needed to reconstruct N314 from scratch.*
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
|-------|-----------|-----------------|
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

**Key HTML notes:**
- `<div id="auth-gate" class="hidden">` — initially hidden; `auth.js` populates and shows it if not authenticated
- `viewport-fit=cover` + `maximum-scale=1.0` — prevents iOS zoom and respects notch
- `apple-mobile-web-app-capable` + `black-translucent` status bar — required for true full-screen PWA on iOS
- Icons use inline data URIs (no external icon files needed)
- CSS loaded from compiled `./css/output.css` (not CDN Tailwind, not inline `<style>`)
- Plotly loaded synchronously via CDN before any module scripts execute
- Service Worker registered via inline script after the module scripts

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

**Alpha Vantage API notes:**
- Endpoint: `TIME_SERIES_DAILY` with `outputsize=full` (returns up to 20 years of daily data)
- The response key is literally `"Time Series (Daily)"` (note the space and parentheses)
- Each entry has keys like `"4. close"` — always access with bracket notation
- Free tier limits: 5 requests/minute, 25 requests/day
- Rate limit responses come back as HTTP 200 with a `"Note"` key (not a 429 status) — this must be checked explicitly
- Daily quota exceeded responses come back as HTTP 200 with an `"Information"` key — also check explicitly
- A 15-second `AbortController` timeout is applied to all fetch calls

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

**MathEngine critical details:**
- **SMA**: Pads leading values with `null` for Plotly alignment. Period 50 means first 49 values are `null`.
- **RSI**: Uses Wilder's smoothing (exponential smoothing, not SMA). First `period` values are `null`. Handles zero-loss edge case.
- **MACD**: Computes EMA of the filtered non-null MACD values for signal line, then re-maps back to full-length array with `null` padding. Returns `{ macd, signal, histogram }`.
- **Forecast**: Linear regression over the last 30 prices, projects 7 days forward. Output is bounded to ±20% of the last close price to prevent unrealistic forecasts.
- **MathTarget**: RSI acts as a dynamic weight — oversold (RSI < 30) gives less weight to forecast (0.3), overbought (RSI > 70) gives more weight (0.7).

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

**Gemini API critical notes:**
- Model: `gemini-2.5-flash` (NOT `gemini-pro`, NOT `gemini-1.5-flash`)
- API endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=API_KEY`
- Uses `responseMimeType: 'application/json'` and `responseSchema` in `generationConfig` to enforce structured output
- **Important**: Do NOT add `"tools": [{"googleSearch": {}}]` to the payload. The Search Grounding tool is incompatible with `responseMimeType: 'application/json'` — it causes a 400 error. This was a bug that was explicitly fixed during development.
- Response structure: `data.candidates[0].content.parts[0].text` — this is a JSON string that must be `JSON.parse()`d
- 30-second timeout via AbortController
- Validation ensures all four required fields are present and have valid types/ranges

---

### 7.7 `js/uiManager.js`

```javascript
export class UiManager {
  static initializeChart() {
    const chartPrice = document.getElementById('chart-price');
    const chartIndicators = document.getElementById('chart-indicators');
    if (chartPrice) chartPrice.innerHTML = '<p class="text-gray-400 text-center py-8">Run analysis to view price chart</p>';
    if (chartIndicators) chartIndicators.innerHTML = '<p class="text-gray-400 text-center py-8">Run analysis to view technical indicators</p>';
  }

  static renderCharts(dates, prices, sma50, sma200, rsi, macd, forecast, forecastDates) {
    if (typeof Plotly === 'undefined') {
      this.showToast('Plotly library not loaded', 'error');
      return;
    }

    this._renderPriceChart(dates, prices, sma50, sma200, forecast, forecastDates);
    this._renderTechnicalIndicators(dates, rsi, macd);
  }

  static _renderPriceChart(dates, prices, sma50, sma200, forecast, forecastDates) {
    try {
      if (!dates || !prices || dates.length === 0 || prices.length === 0) {
        console.error('Invalid price data for chart rendering');
        this.showToast('Unable to render chart: invalid data', 'error');
        return;
      }

      const tracePrice = {
        x: dates,
        y: prices,
        mode: 'lines',
        name: 'Price',
        line: { color: '#3b82f6', width: 2 }
      };

      const traceSma50 = {
        x: dates,
        y: sma50 || [],
        mode: 'lines',
        name: 'SMA 50',
        line: { color: '#f97316', width: 1.5, dash: 'dash' }
      };

      const traceSma200 = {
        x: dates,
        y: sma200 || [],
        mode: 'lines',
        name: 'SMA 200',
        line: { color: '#ef4444', width: 1.5, dash: 'dash' }
      };

      const traceForecast = {
        x: forecastDates || [],
        y: forecast || [],
        mode: 'lines+markers',
        name: 'Forecast (7d)',
        line: { color: '#10b981', width: 2, dash: 'dot' },
        marker: { size: 6 }
      };

      const data = [tracePrice, traceSma50, traceSma200, traceForecast];

      const layout = {
        title: { text: 'Price Action & Forecasts', font: { color: '#ffffff' } },
        paper_bgcolor: '#1f2937',
        plot_bgcolor: '#1f2937',
        xaxis: { title: 'Date', color: '#9ca3af', gridcolor: '#374151' },
        yaxis: { title: 'Price ($)', color: '#9ca3af', gridcolor: '#374151' },
        legend: { font: { color: '#9ca3af' } },
        font: { color: '#9ca3af' },
        margin: { l: 55, r: 20, t: 50, b: 50 },
        autosize: true,
        hovermode: 'x unified'
      };

      Plotly.newPlot('chart-price', data, layout, { responsive: true, displayModeBar: false });
    } catch (error) {
      console.error('Error rendering price chart:', error);
      this.showToast('Error rendering chart. Check console for details.', 'error');
    }
  }

  static _renderTechnicalIndicators(dates, rsi, macd) {
    try {
      if (!dates || !rsi || dates.length === 0 || rsi.length === 0) {
        console.error('Invalid indicator data for chart rendering');
        this.showToast('Unable to render indicators: invalid data', 'error');
        return;
      }

      const traces = [];

      traces.push({
        x: dates,
        y: rsi,
        mode: 'lines',
        name: 'RSI (14)',
        line: { color: '#8b5cf6', width: 2 },
        yaxis: 'y1'
      });

      if (macd && Array.isArray(macd.macd) && macd.macd.length > 0) {
        traces.push({
          x: dates,
          y: macd.macd,
          mode: 'lines',
          name: 'MACD',
          line: { color: '#06b6d4', width: 1.5 },
          yaxis: 'y2'
        });

        if (Array.isArray(macd.signal) && macd.signal.length > 0) {
          traces.push({
            x: dates,
            y: macd.signal,
            mode: 'lines',
            name: 'Signal',
            line: { color: '#ec4899', width: 1.5, dash: 'dot' },
            yaxis: 'y2'
          });
        }

        if (Array.isArray(macd.histogram) && macd.histogram.length > 0) {
          traces.push({
            x: dates,
            y: macd.histogram,
            type: 'bar',
            name: 'Histogram',
            marker: { color: macd.histogram.map(v => v !== null && v >= 0 ? '#10b981' : '#ef4444') },
            yaxis: 'y2',
            opacity: 0.6
          });
        }
      }

      const layout = {
        title: { text: 'Technical Indicators', font: { color: '#ffffff' } },
        paper_bgcolor: '#1f2937',
        plot_bgcolor: '#1f2937',
        xaxis: { title: 'Date', color: '#9ca3af', gridcolor: '#374151' },
        yaxis: {
          title: 'RSI',
          color: '#9ca3af',
          gridcolor: '#374151',
          range: [0, 100],
          side: 'left'
        },
        yaxis2: {
          title: 'MACD',
          color: '#9ca3af',
          gridcolor: '#374151',
          overlaying: 'y',
          side: 'right',
          showgrid: false
        },
        legend: { font: { color: '#9ca3af' } },
        font: { color: '#9ca3af' },
        margin: { l: 55, r: 55, t: 50, b: 50 },
        autosize: true,
        hovermode: 'x unified',
        shapes: [
          { type: 'line', xref: 'paper', x0: 0, x1: 1, y0: 70, y1: 70, line: { color: '#ef4444', width: 1, dash: 'dot' } },
          { type: 'line', xref: 'paper', x0: 0, x1: 1, y0: 30, y1: 30, line: { color: '#10b981', width: 1, dash: 'dot' } }
        ]
      };

      Plotly.newPlot('chart-indicators', traces, layout, { responsive: true, displayModeBar: false });
    } catch (error) {
      console.error('Error rendering technical indicators:', error);
      this.showToast('Error rendering indicators. Check console for details.', 'error');
    }
  }

  static updateMetrics(ticker, currentPrice, change, changePercent, rsi, mathTarget, action, confidence, sentimentScore) {
    const metricsContainer = document.getElementById('metrics-container');
    if (!metricsContainer) return;

    const safeRsi = typeof rsi === 'number' && !isNaN(rsi) ? rsi : 50;
    const safeMathTarget = typeof mathTarget === 'number' && !isNaN(mathTarget) ? mathTarget : currentPrice;
    const safeConfidence = typeof confidence === 'number' && !isNaN(confidence) ? confidence : 0;
    const safeSentiment = typeof sentimentScore === 'number' && !isNaN(sentimentScore) ? sentimentScore : 0;
    const safeAction = action || 'HOLD';

    const changeColor = change >= 0 ? 'text-green-400' : 'text-red-400';
    const actionColor = safeAction === 'BUY' ? 'bg-green-500' : safeAction === 'SELL' ? 'bg-red-500' : 'bg-yellow-500';
    const upsidePct = ((safeMathTarget - currentPrice) / currentPrice * 100).toFixed(1);

    metricsContainer.innerHTML = `
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p class="text-gray-400 text-sm">Ticker</p>
          <p class="text-2xl font-bold text-white">${ticker}</p>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p class="text-gray-400 text-sm">Price</p>
          <p class="text-2xl font-bold text-white">$${currentPrice.toFixed(2)}</p>
          <p class="${changeColor} text-sm mt-1">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)</p>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p class="text-gray-400 text-sm">RSI (14)</p>
          <p class="text-2xl font-bold text-white">${safeRsi.toFixed(1)}</p>
          <p class="text-gray-400 text-xs mt-1">${safeRsi > 70 ? 'Overbought' : safeRsi < 30 ? 'Oversold' : 'Neutral'}</p>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p class="text-gray-400 text-sm">Math Target</p>
          <p class="text-2xl font-bold text-white">$${safeMathTarget.toFixed(2)}</p>
          <p class="text-gray-400 text-xs mt-1">${upsidePct}% vs current</p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p class="text-gray-400 text-sm">AI Recommendation</p>
          <div class="mt-2">
            <span class="${actionColor} text-white px-4 py-2 rounded font-bold text-lg inline-block">${safeAction}</span>
          </div>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p class="text-gray-400 text-sm">AI Confidence</p>
          <p class="text-2xl font-bold text-white">${(safeConfidence * 100).toFixed(0)}%</p>
          <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all" style="width: ${Math.min(safeConfidence * 100, 100)}%"></div>
          </div>
        </div>
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p class="text-gray-400 text-sm">Sentiment Score</p>
          <p class="text-2xl font-bold ${safeSentiment >= 0 ? 'text-green-400' : 'text-red-400'}">${safeSentiment >= 0 ? '+' : ''}${safeSentiment.toFixed(2)}</p>
          <p class="text-gray-400 text-xs mt-1">${safeSentiment > 0.5 ? 'Bullish' : safeSentiment < -0.5 ? 'Bearish' : 'Neutral'}</p>
        </div>
      </div>
    `;
  }

  static updateLoadingState(isLoading) {
    const button = document.getElementById('analyze-btn');
    const spinner = document.getElementById('loading-spinner');

    if (!button || !spinner) return;

    if (isLoading) {
      button.disabled = true;
      button.classList.add('opacity-50', 'cursor-not-allowed');
      spinner.classList.remove('hidden');
    } else {
      button.disabled = false;
      button.classList.remove('opacity-50', 'cursor-not-allowed');
      spinner.classList.add('hidden');
    }
  }

  static showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
    toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn max-w-xs text-sm`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  static clearMetrics() {
    const metricsContainer = document.getElementById('metrics-container');
    if (metricsContainer) {
      metricsContainer.innerHTML = '<p class="text-gray-400 text-center py-8">Run analysis to see metrics</p>';
    }
    const rationaleContainer = document.getElementById('rationale-container');
    if (rationaleContainer) {
      rationaleContainer.innerHTML = '';
    }
  }

  static hideCharts() {
    if (typeof Plotly !== 'undefined') {
      try { Plotly.purge('chart-price'); } catch (_) {}
      try { Plotly.purge('chart-indicators'); } catch (_) {}
    }
    this.initializeChart();
  }
}
```

---

### 7.8 `manifest.json`

```json
{
  "name": "N314 - Quantitative Trading Sentinel",
  "short_name": "N314",
  "description": "Real-time stock tracking, mathematical forecasting, and AI-sentiment dashboard optimized for iOS",
  "start_url": "/Project-N314/",
  "scope": "/Project-N314/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%23000' width='192' height='192'/><text x='96' y='115' font-size='140' font-weight='bold' fill='%233b82f6' text-anchor='middle'>N</text></svg>",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect fill='%23000' width='512' height='512'/><text x='256' y='320' font-size='400' font-weight='bold' fill='%233b82f6' text-anchor='middle'>N</text></svg>",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 720'><rect fill='%230f172a' width='540' height='720'/><text x='270' y='360' font-size='120' font-weight='bold' fill='%233b82f6' text-anchor='middle'>N314</text></svg>",
      "sizes": "540x720",
      "type": "image/svg+xml",
      "form_factor": "narrow"
    }
  ],
  "categories": ["finance", "productivity"],
  "shortcuts": [
    {
      "name": "Run Analysis",
      "short_name": "Analyze",
      "description": "Run N314 stock analysis",
      "url": "/Project-N314/?action=analyze",
      "icons": [
        {
          "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect fill='%23000' width='96' height='96'/><text x='48' y='60' font-size='60' font-weight='bold' fill='%233b82f6' text-anchor='middle'>N</text></svg>",
          "sizes": "96x96",
          "type": "image/svg+xml"
        }
      ]
    }
  ]
}
```

**Note:** `start_url` and `scope` are set to `/Project-N314/` for GitHub Pages deployment under the `the-entertrainer/Project-N314` repository. If deploying to a different path, update both values.

---

### 7.9 `sw.js`

```javascript
const CACHE_NAME = 'n314-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/output.css',
  './js/app.js',
  './js/auth.js',
  './js/apiFetcher.js',
  './js/mathEngine.js',
  './js/aiController.js',
  './js/uiManager.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (
    event.request.url.includes('alphavantage.co') ||
    event.request.url.includes('generativelanguage.googleapis.com') ||
    event.request.url.includes('cdnjs.cloudflare.com') ||
    event.request.url.includes('cdn.plot.ly')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Network error', { status: 503 });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        return networkResponse;
      });
    })
  );
});
```

---

### 7.10 `css/input.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* iOS PWA safe area */
@layer base {
  * {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  input,
  textarea,
  select {
    -webkit-user-select: text;
    user-select: text;
  }

  body {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  @media (max-width: 640px) {
    body {
      padding-top: max(env(safe-area-inset-top), 0px);
      padding-left: max(env(safe-area-inset-left), 0px);
      padding-right: max(env(safe-area-inset-right), 0px);
      padding-bottom: max(env(safe-area-inset-bottom), 0px);
    }
  }
}

@layer components {
  .plotly-container {
    touch-action: pan-y;
  }

  button:active {
    transform: scale(0.98);
  }
}

@layer utilities {
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in-out;
  }
}
```

### 7.11 `css/output.css`

This is the minified Tailwind output. It MUST be committed to the repository since GitHub Pages has no build step. Generate it by running:

```bash
npm install
npx tailwindcss -i ./css/input.css -o ./css/output.css --minify
```

The exact minified content (copy verbatim):

```
*,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }/*! tailwindcss v3.4.19 | MIT License | https://tailwindcss.com*/*,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:""}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}*{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}input,select,textarea{-webkit-user-select:text;-moz-user-select:text;user-select:text}body{background:linear-gradient(135deg,#0f172a,#1e293b);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,sans-serif}@media (max-width:640px){body{padding:max(env(safe-area-inset-top),0px) max(env(safe-area-inset-right),0px) max(env(safe-area-inset-bottom),0px) max(env(safe-area-inset-left),0px)}}button:active{transform:scale(.98)}.static{position:static}.fixed{position:fixed}.sticky{position:sticky}.inset-0{inset:0}.right-4{right:1rem}.top-0{top:0}.top-4{top:1rem}.z-10{z-index:10}.z-40{z-index:40}.z-50{z-index:50}.mx-4{margin-left:1rem;margin-right:1rem}.mx-auto{margin-left:auto;margin-right:auto}.mb-2{margin-bottom:.5rem}.mb-4{margin-bottom:1rem}.mb-6{margin-bottom:1.5rem}.mb-8{margin-bottom:2rem}.ml-2{margin-left:.5rem}.mt-1{margin-top:.25rem}.mt-2{margin-top:.5rem}.mt-4{margin-top:1rem}.mt-6{margin-top:1.5rem}.block{display:block}.inline-block{display:inline-block}.flex{display:flex}.grid{display:grid}.contents{display:contents}.hidden{display:none}.h-2{height:.5rem}.max-h-\[80vh\]{max-height:80vh}.min-h-96{min-height:24rem}.w-full{width:100%}.max-w-7xl{max-width:80rem}.max-w-md{max-width:28rem}.max-w-xs{max-width:20rem}.flex-1{flex:1 1 0%}.animate-fadeIn{animation:fadeIn .3s ease-in-out}.cursor-not-allowed{cursor:not-allowed}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.flex-col{flex-direction:column}.items-end{align-items:flex-end}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-4{gap:1rem}.space-x-2>:not([hidden])~:not([hidden]){--tw-space-x-reverse:0;margin-right:calc(.5rem*var(--tw-space-x-reverse));margin-left:calc(.5rem*(1 - var(--tw-space-x-reverse)))}.space-y-2>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(.5rem*(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.5rem*var(--tw-space-y-reverse))}.space-y-4>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(1rem*(1 - var(--tw-space-y-reverse)));margin-bottom:calc(1rem*var(--tw-space-y-reverse))}.overflow-y-auto{overflow-y:auto}.overflow-x-hidden{overflow-x:hidden}.rounded{border-radius:.25rem}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:.5rem}.border{border-width:1px}.border-b{border-bottom-width:1px}.border-t{border-top-width:1px}.border-gray-700{--tw-border-opacity:1;border-color:rgb(55 65 81/var(--tw-border-opacity,1))}.border-gray-800{--tw-border-opacity:1;border-color:rgb(31 41 55/var(--tw-border-opacity,1))}.bg-black{--tw-bg-opacity:1;background-color:rgb(0 0 0/var(--tw-bg-opacity,1))}.bg-blue-500{--tw-bg-opacity:1;background-color:rgb(59 130 246/var(--tw-bg-opacity,1))}.bg-blue-600{--tw-bg-opacity:1;background-color:rgb(37 99 235/var(--tw-bg-opacity,1))}.bg-gray-700{--tw-bg-opacity:1;background-color:rgb(55 65 81/var(--tw-bg-opacity,1))}.bg-gray-800{--tw-bg-opacity:1;background-color:rgb(31 41 55/var(--tw-bg-opacity,1))}.bg-gray-900{--tw-bg-opacity:1;background-color:rgb(17 24 39/var(--tw-bg-opacity,1))}.bg-green-500{--tw-bg-opacity:1;background-color:rgb(34 197 94/var(--tw-bg-opacity,1))}.bg-green-600{--tw-bg-opacity:1;background-color:rgb(22 163 74/var(--tw-bg-opacity,1))}.bg-red-500{--tw-bg-opacity:1;background-color:rgb(239 68 68/var(--tw-bg-opacity,1))}.bg-slate-950{--tw-bg-opacity:1;background-color:rgb(2 6 23/var(--tw-bg-opacity,1))}.bg-yellow-500{--tw-bg-opacity:1;background-color:rgb(234 179 8/var(--tw-bg-opacity,1))}.bg-opacity-50{--tw-bg-opacity:0.5}.p-4{padding:1rem}.p-6{padding:1.5rem}.p-8{padding:2rem}.px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.px-8{padding-left:2rem;padding-right:2rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-3{padding-top:.75rem;padding-bottom:.75rem}.py-4{padding-top:1rem;padding-bottom:1rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.py-8{padding-top:2rem;padding-bottom:2rem}.pb-20{padding-bottom:5rem}.text-center{text-align:center}.text-2xl{font-size:1.5rem;line-height:2rem}.text-3xl{font-size:1.875rem;line-height:2.25rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-xs{font-size:.75rem;line-height:1rem}.font-bold{font-weight:700}.uppercase{text-transform:uppercase}.text-blue-500{--tw-text-opacity:1;color:rgb(59 130 246/var(--tw-text-opacity,1))}.text-gray-300{--tw-text-opacity:1;color:rgb(209 213 219/var(--tw-text-opacity,1))}.text-gray-400{--tw-text-opacity:1;color:rgb(156 163 175/var(--tw-text-opacity,1))}.text-gray-500{--tw-text-opacity:1;color:rgb(107 114 128/var(--tw-text-opacity,1))}.text-gray-600{--tw-text-opacity:1;color:rgb(75 85 99/var(--tw-text-opacity,1))}.text-green-400{--tw-text-opacity:1;color:rgb(74 222 128/var(--tw-text-opacity,1))}.text-purple-500{--tw-text-opacity:1;color:rgb(168 85 247/var(--tw-text-opacity,1))}.text-red-400{--tw-text-opacity:1;color:rgb(248 113 113/var(--tw-text-opacity,1))}.text-red-500{--tw-text-opacity:1;color:rgb(239 68 68/var(--tw-text-opacity,1))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}.opacity-50{opacity:.5}.shadow-2xl{--tw-shadow:0 25px 50px -12px rgba(0,0,0,.25);--tw-shadow-colored:0 25px 50px -12px var(--tw-shadow-color)}.shadow-2xl,.shadow-lg{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.shadow-lg{--tw-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);--tw-shadow-colored:0 10px 15px -3px var(--tw-shadow-color),0 4px 6px -4px var(--tw-shadow-color)}.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}@keyframes fadeIn{0%{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.animate-fadeIn{animation:fadeIn .3s ease-in-out}.hover\:bg-blue-700:hover{--tw-bg-opacity:1;background-color:rgb(29 78 216/var(--tw-bg-opacity,1))}.hover\:bg-gray-800:hover{--tw-bg-opacity:1;background-color:rgb(31 41 55/var(--tw-bg-opacity,1))}.hover\:bg-green-700:hover{--tw-bg-opacity:1;background-color:rgb(21 128 61/var(--tw-bg-opacity,1))}.hover\:text-white:hover{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}.focus\:border-blue-500:focus{--tw-border-opacity:1;border-color:rgb(59 130 246/var(--tw-border-opacity,1))}.focus\:outline-none:focus{outline:2px solid transparent;outline-offset:2px}@media (min-width:768px){.md\:w-auto{width:auto}.md\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.md\:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}.md\:flex-row{flex-direction:row}}
```

---

### 7.12 `package.json`

```json
{
  "name": "project-n314",
  "version": "1.0.0",
  "description": "N314 - Quantitative Trading Sentinel PWA",
  "private": true,
  "scripts": {
    "build:css": "tailwindcss -i ./css/input.css -o ./css/output.css --minify",
    "watch:css": "tailwindcss -i ./css/input.css -o ./css/output.css --watch"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17"
  }
}
```

---

### 7.13 `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './js/**/*.js'
  ],
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'spin': 'spin 1s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}
```

---

### 7.14 `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

---

### 7.15 `.gitignore`

```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE and editor
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Build outputs (keep css/output.css tracked for GitHub Pages)
dist/
build/
out/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
Thumbs.db
.AppleDouble
.LSOverride
```

**Critical note:** `css/output.css` is intentionally NOT in `.gitignore`. It must be committed because GitHub Pages cannot run the Tailwind build step.

---

## 8. Development History & Bug Fixes

The following bugs were discovered and fixed during the original build. Any AI rebuilding this project needs to be aware of these pitfalls:

### Bug 1: Google Search Grounding + JSON Mode Incompatibility
**Symptom:** Gemini API returned HTTP 400 when both `"tools": [{"googleSearch": {}}]` and `"responseMimeType": "application/json"` were included in the same request.  
**Root Cause:** Google's Gemini API does not allow Search Grounding tool to be combined with structured JSON response mode.  
**Fix:** Removed `"tools": [{"googleSearch": {}}]` from the request payload entirely. The model still has knowledge of market conditions from its training data; it simply doesn't do live web searches.

### Bug 2: Alpha Vantage Rate Limit Responses Are HTTP 200
**Symptom:** Rate limit exceeded but `response.ok` was `true`, so no error was thrown.  
**Root Cause:** Alpha Vantage returns HTTP 200 with a `"Note"` key in the JSON body when rate-limited (not HTTP 429). Daily quota exceeded responses use an `"Information"` key.  
**Fix:** Added explicit checks for both `data.Note` and `data['Information']` in `apiFetcher.js`.

### Bug 3: MACD Signal Line Array Length Mismatch
**Symptom:** Plotly threw errors when rendering the MACD indicator chart.  
**Root Cause:** Signal line EMA was calculated on the filtered (non-null) MACD values, producing a shorter array. When re-mapped, indices didn't align correctly.  
**Fix:** Carefully re-indexed using a separate `emaIdx` counter when mapping the signal EMA values back to the full-length array.

### Bug 4: Tailwind CSS Not Applied on GitHub Pages
**Symptom:** Page loaded with no styling (unstyled HTML).  
**Root Cause:** Initially used CDN Tailwind `<script>` tag which doesn't work with GitHub Pages CSP + ES module environment.  
**Fix:** Set up full Tailwind CLI build pipeline (PostCSS, `npm run build:css`), generated `css/output.css`, linked that file in `index.html`, and committed the output file.

### Bug 5: Import Statements Missing `.js` Extension
**Symptom:** Modules failed to load on GitHub Pages with 404 errors.  
**Root Cause:** Browser ES modules require explicit `.js` extensions; bundler-style bare imports don't work.  
**Fix:** All import statements use explicit `.js` extensions: `import { AuthManager } from './auth.js'`.

---

## 9. Setup & Deployment Instructions

### Step 1: Clone or Create Repository

```bash
git clone https://github.com/YOUR_USERNAME/Project-N314.git
cd Project-N314
```

### Step 2: Create All Files

Recreate every file from Section 7 above with exact content.

### Step 3: Build the CSS

```bash
npm install
npm run build:css
```

This generates `css/output.css` which must be committed.

### Step 4: Commit & Push

```bash
git add .
git commit -m "feat: Build complete N314 PWA"
git push origin main
```

### Step 5: Enable GitHub Pages

In the GitHub repository settings:
- Source: Deploy from branch `main`
- Folder: `/ (root)`

The app will be live at: `https://YOUR_USERNAME.github.io/Project-N314/`

### Step 6: Update manifest.json

If your GitHub username is not `the-entertrainer`, update `manifest.json`:
```json
"start_url": "/YOUR_REPO_NAME/",
"scope": "/YOUR_REPO_NAME/"
```

### Step 7: Run Locally for Testing

```bash
python -m http.server 8000
# OR
npx http-server
```

Navigate to `http://localhost:8000`

---

## 10. API Key Acquisition

### Google Gemini API Key
1. Go to https://aistudio.google.com/app/apikeys
2. Sign in with a Google account
3. Click "Create API Key"
4. Copy the key (format: `AIza...`)

**Free tier:** Generous rate limits; sufficient for personal use.

### Alpha Vantage API Key
1. Go to https://www.alphavantage.co/
2. Click "Get your free API key today"
3. Fill out the short form
4. Copy the API key

**Free tier limits:**
- 5 API requests per minute
- 25 API requests per day (standard free tier note the `Information` field)

---

## 11. First-Use Flow (Testing Protocol)

1. Open the app in a browser (local or GitHub Pages)
2. The passcode gate appears — enter `thinkmoney`
3. Click the ⚙️ gear icon in the top-right header
4. Enter both API keys → click "Save Settings"
5. Type a ticker in the input box (e.g., `AAPL`)
6. Click "Run N314 Analysis" (or press Enter)
7. Wait 6–10 seconds
8. **Expected output:**
   - 4 metric cards: Ticker, Price (with change %), RSI (14), Math Target
   - 3 AI cards: AI Recommendation (BUY/HOLD/SELL badge), AI Confidence (% with progress bar), Sentiment Score
   - Price chart with blue line (price), orange dashed (SMA 50), red dashed (SMA 200), green dotted (7-day forecast)
   - Technical indicator chart with purple line (RSI), cyan line (MACD), pink dotted (Signal), green/red bars (Histogram)
   - RSI chart has horizontal reference lines at 30 (oversold, green) and 70 (overbought, red)
   - Strategic Rationale card with Gemini's 2-sentence analysis

---

## 12. Metrics Dashboard Reference

| Metric Card | Value | Color Logic |
|------------|-------|-------------|
| Ticker | e.g., `AAPL` | White |
| Price | `$XXX.XX` + `+/- change` | Green if positive, red if negative |
| RSI (14) | `XX.X` + label | Label: Overbought (>70), Oversold (<30), Neutral |
| Math Target | `$XXX.XX` + `X% vs current` | White (upside/downside % shown) |
| AI Recommendation | `BUY` / `HOLD` / `SELL` badge | Green / Yellow / Red |
| AI Confidence | `XX%` + progress bar | Blue progress bar |
| Sentiment Score | `+X.XX` / `-X.XX` + label | Green if positive, red if negative; Bullish/Bearish/Neutral |

---

## 13. Color Palette Reference

All UI uses Tailwind dark theme colors:

| Use | Tailwind Class | Hex |
|-----|---------------|-----|
| Page background | `bg-slate-950` | `#020617` |
| Card/panel background | `bg-gray-900` | `#111827` |
| Inner card background | `bg-gray-800` | `#1f2937` |
| Border color | `border-gray-800` | `#1f2937` |
| Primary text | `text-white` | `#ffffff` |
| Secondary text | `text-gray-400` | `#9ca3af` |
| Accent blue | `text-blue-500` | `#3b82f6` |
| Success green | `text-green-400` | `#4ade80` |
| Error red | `text-red-400` | `#f87171` |
| Chart price line | — | `#3b82f6` |
| Chart SMA 50 | — | `#f97316` |
| Chart SMA 200 | — | `#ef4444` |
| Chart forecast | — | `#10b981` |
| Chart RSI | — | `#8b5cf6` |
| Chart MACD | — | `#06b6d4` |
| Chart Signal | — | `#ec4899` |

---

## 14. Known Limitations & Future Enhancement Opportunities

The following were explicitly called out as future enhancements (not yet implemented):

- Real-time WebSocket price updates instead of daily snapshots
- Multiple ticker watchlist with parallel analysis
- Historical sentiment archive and correlation analysis
- Export reports as PDF
- Dark/light theme toggle
- Offline capability with IndexedDB caching (currently uses Service Worker cache-first strategy, but API data is not cached)

---

## 15. Final Verification Checklist

Before declaring the reconstruction complete, verify:

- [ ] Passcode gate appears on first load and blocks all UI
- [ ] "thinkmoney" passcode grants access; wrong passcode shows error message
- [ ] Settings modal opens with ⚙️ button; saves both API keys to localStorage
- [ ] Ticker input auto-uppercases; validates 1–5 letter format; Enter key triggers analysis
- [ ] Loading spinner appears on the Analyze button during pipeline execution
- [ ] All 5 pipeline steps log to console (`[Pipeline] Step X: ...`)
- [ ] Toast notifications appear top-right (green for success, red for error, blue for info)
- [ ] Price chart renders with price line, SMA 50, SMA 200, and 7-day forecast extension
- [ ] Indicator chart renders RSI (left axis, 0–100), MACD+Signal+Histogram (right axis)
- [ ] RSI chart has reference lines at 30 and 70
- [ ] Math Target card shows % upside/downside vs current price
- [ ] AI Recommendation badge is color-coded (green=BUY, yellow=HOLD, red=SELL)
- [ ] Strategic Rationale card appears below the charts
- [ ] App is installable via "Add to Home Screen" on iOS
- [ ] Service Worker registers successfully (check DevTools > Application > Service Workers)
- [ ] No 404 errors for any JS module imports (check Network tab)
- [ ] All arrays in MathEngine output match `dates.length` (no Plotly length mismatch errors)

---

*End of handoff document. This document contains every file, every design decision, every known bug and its fix, and the complete architecture needed to reconstruct N314 from scratch.*

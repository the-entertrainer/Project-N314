# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project**: N314 - Quantitative Trading Sentinel  
**Description**: Real-time stock tracking, mathematical forecasting, and AI-sentiment dashboard optimized as an iOS-first Progressive Web App (PWA)  
**Tech Stack**: Vanilla JavaScript (ES6 Modules), Tailwind CSS, Plotly.js, Google Gemini API, Alpha Vantage API  
**Deployment**: 100% GitHub Pages compatible (no build step required)

## Architecture

### File Structure

```
/Project-N314/
├── index.html                 # Main PWA entry point with iOS meta tags
├── manifest.json              # PWA manifest for installability
├── js/
│   ├── app.js                # Main app orchestration & strict async pipeline
│   ├── auth.js               # Passcode gate ("thinkmoney") & API key settings
│   ├── apiFetcher.js         # Alpha Vantage API integration with error handling
│   ├── mathEngine.js         # Quantitative calculations (SMA, RSI, MACD, Forecast)
│   ├── aiController.js       # Google Gemini API with Search Grounding
│   └── uiManager.js          # DOM manipulation, Plotly charts, Toast notifications
```

### Core Module Responsibilities

**`app.js`** - Strict Async Execution Pipeline
- Orchestrates five-stage pipeline: Fetch → Compute Math → AI Sentiment → Fusion → Render UI
- Each stage `await`s the previous stage before proceeding
- Error handling with user-facing Toast alerts
- Validates inputs (ticker symbols, API keys)

**`auth.js`** - Security & State Management
- Passcode gate on DOM load: requires "thinkmoney" for session access (stored in `sessionStorage`)
- Settings modal for Gemini API Key and Financial API Key (stored in `localStorage`)
- Checks `sessionStorage.getItem("n314_auth")` at startup; blocks all UI until authenticated

**`apiFetcher.js`** - Data Acquisition
- `fetchStockData(ticker, apiKey)`: Retrieves full historical daily OHLCV from Alpha Vantage
- `fetchCurrentPrice(ticker, apiKey)`: Gets real-time quote data
- Returns aligned `{ ticker, dates, prices, currentPrice }` objects
- Explicit `try/catch` for CORS, rate limits, and invalid API keys with user-facing error messages

**`mathEngine.js`** - Quantitative Analysis
- `calculateSMA(prices, period)`: Simple Moving Average (50, 200)
- `calculateRSI(prices)`: Wilder's Smoothing RSI (14-period)
- `calculateMACD(prices)`: MACD (12-26-9) with signal and histogram
- `calculateForecast(prices)`: Linear regression over last 30 closes → 7-day projection with ±20% variance bounds
- `calculateMathTarget(currentPrice, rsi, forecast)`: Fusion of current price, RSI signal, and forecast
- **Critical**: All output arrays padded with leading `null` values to match input `dates` length (Plotly requirement)

**`aiController.js`** - AI-Powered Sentiment
- `analyzeSentiment(ticker, currentPrice, rsi, macd, mathTarget, geminiApiKey)`
- Payload: REST POST to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`
- Search Grounding: `"tools": [{"googleSearch": {}}]` for live news context
- Structured JSON Response: Enforces schema with `responseMimeType: "application/json"` and `responseSchema` object
- Returns: `{ sentiment_score, ai_confidence_interval, investment_action, strategic_rationale }`

**`uiManager.js`** - UI Rendering & Visualization
- `renderCharts()`: Plotly dual-chart system (price action + technical indicators)
- `updateMetrics()`: KPI cards (ticker, price, change, RSI, math target, AI action, confidence, sentiment)
- `showToast(message, type)`: Temporary notifications for success/error/info
- `updateLoadingState()`: Spinner and button disable during analysis

### iOS PWA Optimization

**Meta Tags in `index.html`:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#000000">
```

**Safe Area & Viewport Handling:**
- CSS uses `safe-area-inset-*` for notch/home indicator support
- Tailwind responsive breakpoints optimized for iPhone viewport widths
- Plotly charts responsive with touch-enabled panning

**Installation & Manifest:**
- `manifest.json` defines PWA name, icons (SVG), display mode, start URL
- Users can "Add to Home Screen" on iOS 13+

## Security & State Management

1. **Passcode Gate**: On first page load, `auth.js` checks `sessionStorage.getItem("n314_auth")`
   - If missing: Full-screen dark modal demands "thinkmoney" passcode
   - No other UI elements visible until authenticated
   - Passcode valid for the session duration (cleared on browser close)

2. **API Key Management**: Settings modal (⚙️ icon, top-right) allows user input
   - Gemini API Key → `localStorage.getItem("n314_gemini_key")`
   - Financial API Key → `localStorage.getItem("n314_financial_key")`
   - Keys never sent to any server except their respective APIs

3. **Execution Pipeline**: Strict `await` sequence prevents race conditions
   - Step 1: Fetch → Step 2: Math → Step 3: AI → Step 4: Fusion → Step 5: Render
   - Each step throws on error; pipeline halts and shows Toast

## Common Development Commands

```bash
# Run local dev server (requires Python 3 or Node.js http-server)
python -m http.server 8000
# OR
npx http-server

# View in browser
open http://localhost:8000

# Commit changes
git add .
git commit -m "Descriptive message"

# Push to development branch
git push -u origin <branch-name>

# Push to main (after PR approval)
git push origin <branch-name>:main
```

## Deployment & GitHub Pages

- **No build step**: All code is vanilla ES6 modules and static assets
- **CRITICAL**: Every `import` must include `.js` extension (e.g., `import { MathEngine } from './mathEngine.js'`)
  - GitHub Pages serves static files; no bundler rewrites imports
  - Missing `.js` causes catastrophic 404 errors
- **URL rewriting**: Update `manifest.json` `start_url` and `scope` if deploying to a subdirectory
- Deploy by pushing to `main` branch; GitHub Pages automatically serves from `/Project-N314/`

## Key Development Practices

1. **No Bundler**: Vanilla ES6 modules only. Every import requires `.js` extension.
2. **No Placeholders**: All code is 100% functional. No `// logic goes here` or TODOs.
3. **Array Alignment**: Math engine outputs must match input `dates` array length (pad with `null` at start).
4. **Error Handling**: Every API call wrapped in `try/catch` with user-facing Toast message.
5. **Async Pipeline**: Use strict `await` sequence; never fire parallel API calls or computations.
6. **iOS Testing**: Test on iPhone/iPad simulator or real device before pushing. Verify:
   - Passcode gate appears and authenticates correctly
   - Settings modal saves/retrieves API keys
   - Charts render and respond to touch
   - Safe areas respected (notch, home indicator)
   - Installable to home screen

## API Keys Required

Users must configure these in Settings before analysis:
1. **Gemini API Key**: Get from https://aistudio.google.com/app/apikeys
2. **Alpha Vantage API Key**: Get from https://www.alphavantage.co/

## Testing the Full Pipeline

1. Enter ticker (e.g., "AAPL")
2. Click "Run N314 Analysis"
3. Expected: 5-second delay as pipeline executes
4. Expected output:
   - Price chart with SMA 50/200 and 7-day forecast
   - RSI and MACD technical indicators
   - Metrics: current price, RSI, math target, AI action (BUY/HOLD/SELL)
   - Sentiment score and strategic rationale from Gemini

## Future Enhancements

- Real-time WebSocket price updates instead of daily snapshots
- Multiple ticker watchlist with parallel analysis
- Historical sentiment archive and correlation analysis
- Export reports as PDF
- Dark/light theme toggle
- Offline capability with IndexedDB caching

# N314 - Quantitative Trading Sentinel

A real-time stock tracking, mathematical forecasting, and AI-sentiment dashboard optimized as an iOS-first Progressive Web App (PWA). Built with vanilla JavaScript (ES6 modules) and deployable directly to GitHub Pages.

## Features

### 🔐 Security-First Design
- **Passcode-protected** access ("thinkmoney") with session-based authentication
- **Secure API key management** stored in browser localStorage
- **No backend required** - all processing client-side

### 📊 Real-Time Stock Analysis
- **Historical data**: Fetch up to 20 years of daily OHLCV from Alpha Vantage
- **Live price updates**: Current quote data with change tracking
- **Technical indicators**: SMA 50/200, RSI (14), MACD (12-26-9)

### 🎯 Quantitative Forecasting
- **7-day linear regression forecast** based on last 30 closing prices
- **Variance-bounded predictions** (±20%) to prevent wild deviations
- **Math target calculation** fusing current price, RSI, and forecast

### 🧠 AI-Powered Sentiment Analysis
- **Google Gemini 2.5 Flash** with real-time web search grounding
- **Structured JSON responses**: Sentiment score (-1.0 to 1.0), confidence, investment action
- **Investment recommendations**: BUY, HOLD, SELL with strategic rationale

### 📱 iOS PWA Optimization
- **Safe area support** for notch and home indicator
- **Installable** to iOS home screen (Add to Home Screen)
- **Offline capability** with Service Worker caching
- **Responsive charts** with touch-enabled Plotly.js visualization

## Quick Start

### 1. Get API Keys

**Google Gemini API Key:**
- Visit https://aistudio.google.com/app/apikeys
- Create a new API key
- Copy it for use in N314

**Alpha Vantage Financial API Key:**
- Visit https://www.alphavantage.co/
- Sign up for a free account
- Generate your API key

### 2. Deploy to GitHub Pages

1. Clone this repository
2. Push to your GitHub Pages branch
3. Access at `https://your-username.github.io/Project-N314/`

### 3. Run Locally

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Then visit http://localhost:8000
```

### 4. Authenticate & Configure

1. **Passcode**: Enter "thinkmoney" on the lock screen
2. **Settings** (⚙️ icon): Input your API keys:
   - Gemini API Key
   - Alpha Vantage API Key

### 5. Run Analysis

1. Enter a stock ticker (e.g., "AAPL", "TSLA", "GOOGL")
2. Click "Run N314 Analysis"
3. Wait 5-10 seconds as the pipeline executes:
   - Fetch → Compute Math → AI Sentiment → Fusion → Render UI

## Architecture

### Core Modules

**`js/mathEngine.js`** - Quantitative Calculations
- `calculateSMA(prices, period)` - Simple Moving Averages
- `calculateRSI(prices)` - Relative Strength Index
- `calculateMACD(prices)` - Moving Average Convergence Divergence
- `calculateForecast(prices)` - 7-day linear regression projection

**`js/apiFetcher.js`** - Data Integration
- Fetches historical and current stock data from Alpha Vantage
- Error handling with user-facing Toast alerts
- CORS-aware fetch with retry logic

**`js/aiController.js`** - AI Analysis
- Google Gemini API integration with Search Grounding
- Structured JSON response validation
- Sentiment score, confidence, and investment action

**`js/uiManager.js`** - User Interface
- Dual-chart visualization (price action + technical indicators)
- Real-time metrics dashboard
- Toast notifications and loading states

**`js/auth.js`** - Authentication & Settings
- Passcode gate on page load
- Secure API key storage and retrieval
- Settings modal UI

**`js/app.js`** - Orchestration
- Strict async execution pipeline
- Event listeners and state management
- Error handling and validation

## Execution Pipeline

```
1. FETCH DATA
   └─ Await historical prices from Alpha Vantage

2. COMPUTE MATH
   └─ Await SMA, RSI, MACD, Forecast calculations

3. AI SENTIMENT
   └─ Await Gemini API response with web search

4. FUSION MATH
   └─ Await blending sentiment with technical forecast

5. RENDER UI
   └─ Await Plotly chart rendering and metrics display
```

## Technical Specifications

### Technology Stack
- **Frontend**: Vanilla JavaScript ES6 Modules
- **Styling**: Tailwind CSS (CDN)
- **Charts**: Plotly.js (CDN)
- **Icons**: FontAwesome (CDN)
- **APIs**:
  - Alpha Vantage (stock data)
  - Google Gemini (sentiment analysis)
- **Storage**: localStorage, sessionStorage, Service Worker cache

### Browser Support
- iOS 13+ (Safari)
- Chrome 90+
- Firefox 88+
- Edge 90+

### Security
- No backend server
- API keys stored locally (never transmitted to external servers except their respective APIs)
- Passcode-based session authentication
- CORS-aware fetch with error handling

## Customization

### Change Passcode
Edit `js/auth.js`, line 3:
```javascript
static CORRECT_PASSCODE = 'thinkmoney'; // Change this
```

### Adjust Technical Indicators
Edit `js/mathEngine.js`:
- SMA periods: `calculateSMA(prices, 50)` → change `50` to desired period
- RSI period: `calculateRSI(prices, 14)` → change `14`
- Forecast days: `calculateForecast()` → modify loop limit

### Modify Forecast Variance Bounds
Edit `js/mathEngine.js`, `calculateForecast()`:
```javascript
const boundedPrice = Math.max(
  last30[n - 1] * 0.8,    // Lower bound: -20%
  Math.min(last30[n - 1] * 1.2, projectedPrice)  // Upper bound: +20%
);
```

## Troubleshooting

### "API Rate Limit Exceeded"
- Alpha Vantage free tier: 5 requests per minute, 500 per day
- Wait 1+ minute or upgrade to premium

### "Invalid Gemini API Key"
- Verify key at https://aistudio.google.com/app/apikeys
- Ensure key is NOT expired or revoked

### Charts Not Rendering
- Check browser console for errors (F12)
- Verify Plotly.js CDN is accessible
- Ensure data arrays are properly aligned with dates

### Passcode Not Accepted
- Default passcode is "thinkmoney" (case-sensitive)
- Clear sessionStorage if stuck: `sessionStorage.clear()` in console

## Performance Notes

- **Data fetch**: ~2-3 seconds (depends on API response)
- **Math calculations**: ~500ms
- **AI sentiment**: ~3-5 seconds (Gemini API latency)
- **UI rendering**: ~1 second

**Total analysis time**: 6-10 seconds

## Privacy & Disclaimers

- **No analytics** - N314 does not track user behavior
- **Local storage only** - API keys never leave your device
- **Not financial advice** - AI recommendations are informational only
- **Always validate** investment decisions independently
- **Risk disclosure** - Trading carries significant risk of loss

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Commit with clear messages
4. Push and open a pull request

## License

MIT License - Feel free to use, modify, and distribute.

## Support

For issues or questions:
- Check the CLAUDE.md file for development guidance
- Review the error message in the Toast notification
- Check browser console (F12) for detailed error logs

---

**N314** - Where quantitative analysis meets AI-powered sentiment. Trade smarter, not harder.

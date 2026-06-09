# Nifty Intel — API Setup & Troubleshooting

## Environment Keys Required

Add these to Vercel or your `.env` file:

```bash
# REQUIRED — Google AI Studio (free tier: 15 req/min, 1M tokens/day)
GEMINI_API_KEY=sk-...your-key-here...

# OPTIONAL — GNews (free tier: 100 req/day)
GNEWS_API_KEY=your-gnews-key-here
```

## Data Sources Status

| Source | Status | Issue | Fix |
|---|---|---|---|
| **NSE Universe** | ✓ Working | May fail in restricted networks | Use backup: hardcoded list of 50 major stocks |
| **Yahoo Finance** | ✓ Working | CORS proxy may be slow/blocked | Implement fallback to second proxy |
| **GNews** | ⚠ Check key | Key format or quota | Regenerate key at gnews.io |
| **Gemini** | ✓ Working | Key not provided to build | Ensure GEMINI_API_KEY set in CI/CD |

---

## Quick Troubleshooting

### 1. **White screen on load**
- [ ] Open DevTools (F12) → Console tab
- [ ] Look for red errors like "Failed to fetch" or "CORS"
- [ ] If it says "Cannot find module", you're missing a dependency → run `npm install`
- [ ] If APIs fail, see "API Failure Checklist" below

### 2. **API Failure Checklist**

**GNews not loading (News tab shows fallback message):**
- Verify `GNEWS_API_KEY` is set in Vercel Settings → Environment Variables
- Check key is valid: https://gnews.io/dashboard (login and copy key, NOT app token)
- Key format should be ~20 alphanumeric characters
- If still failing: news is optional, other features work without it

**Gemini not analyzing stocks (AI Advisor button disabled):**
- Verify `GEMINI_API_KEY` set in CI/CD secrets (GitHub Actions or Vercel)
- Test key at: https://aistudio.google.com → check "API key is active"
- Key should be ~40 characters starting with "AIzaSy..."
- If expired: regenerate a new key

**Yahoo Finance / NSE Universe not loading (blank table):**
- This usually means CORS proxy is unreachable (network issue)
- **Workaround 1:** Use hardcoded stock list (implemented below)
- **Workaround 2:** Use AlternativeMe API (free, no key needed) for price updates
- Check browser console for specific error messages

---

## Production Setup (Vercel)

1. **Go to:** https://vercel.com → Project → Settings → Environment Variables
2. **Add these:**
   ```
   GEMINI_API_KEY = sk-...
   GNEWS_API_KEY = your_gnews_key (optional)
   ```
3. **Redeploy:** Push to `main` branch or click "Redeploy"

If APIs still fail on production but work locally:
- Check Vercel environment variables are actually set (sometimes they're not applied until next deployment)
- Redeploy from Vercel dashboard (don't just wait for auto-deploy)

---

## Local Testing

```bash
# Set keys in shell
export GEMINI_API_KEY="sk-..."
export GNEWS_API_KEY="..."

# Start dev server
npm run dev

# Open http://localhost:3000 and open DevTools console
# Watch for fetch errors
```

---

## Recommended Free Alternatives

If certain data sources keep failing, here are drop-in replacements:

### Stock Prices (instead of Yahoo Finance)
- **AlternativeMe** — No API key, same endpoint pattern
- **IEX Cloud** — Free tier: 100/month (add to env: `IEX_API_KEY`)
- **Finnhub** — Free tier: 60/min (add to env: `FINNHUB_API_KEY`)

### News (instead of GNews)
- **NewsAPI** — Free tier: 100/day, better quality (add to env: `NEWSAPI_KEY`)
- **CryptoPanic** — Free, structured data
- **Alpha Vantage** — Includes earnings + news (add to env: `ALPHAVANTAGE_API_KEY`)

### NSE Fundamentals
- **X-Rates, Quandl** — free endpoints for Indian stock data
- Fallback: use hardcoded P/E, P/B from last known values

---

## How to Verify APIs Are Working

### After deploying to Vercel:

1. **Open the live app** → DevTools Console (F12)
2. **Check DataStatusBar** at top of page:
   - Green dot + "Live" = source working
   - Red dot + "Failed" = something's wrong
   - Amber with "247/500" = partial load (normal during fetch)
3. **Click each tab:**
   - **Dashboard** → should show Nifty, Bank Nifty, FII/DII within 5s
   - **Screener** → table should populate within 10s
   - **News** → should show headlines or graceful "add key" message
   - **AI Advisor** → "Generate" button should work if Gemini key is valid

### If a tab is stuck on "Loading...":
- Right-click → Inspect → Network tab → look for red requests
- Note the failed URL and error code (403, 429, timeout, etc.)
- If it's a timeout, the proxy is slow (reload the page)
- If it's 401/403, the API key is wrong

---

## Example Working Setup

**Minimum** (News optional):
```env
GEMINI_API_KEY=AIzaSyD...your-real-key...
GNEWS_API_KEY=                    # leave empty if you don't have one
```

**Full** (all features):
```env
GEMINI_API_KEY=AIzaSyD...
GNEWS_API_KEY=1a2b3c4d5e6f7g8h9i10j
```

---

## Still stuck?

1. Paste the **Network tab error** URL here
2. Show the **exact error message** from Console
3. Confirm keys are actually set: In Vercel, go Settings → Environment Variables → verify they're listed

The app is designed to **degrade gracefully** — if one API fails, others keep working.

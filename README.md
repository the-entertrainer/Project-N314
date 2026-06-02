# Nifty Intel

A one-stop personal trading intelligence platform for the Indian markets. It fuses **live NSE/BSE market data**, **F&O signals**, **world news**, and **AI reasoning** (Google Gemini) into actionable short- and long-term calls.

**Live:** https://the-entertrainer.github.io/Project-N314/

## Modules

| Tab | What it does |
|---|---|
| **Dashboard** | Live Nifty / Bank Nifty / Sensex + global index cards, FII/DII flow, top gainers & losers |
| **Screener** | Virtualized NIFTY 500 table with composite score, grade, and smart-money flags; sort & filter |
| **Deep Dive** | 1Y price chart (MA50/MA200 + volume), full fundamentals grid, on-demand AI analysis |
| **F&O Intelligence** | Smart-money accumulation signals, NIFTY option-chain PCR & max pain |
| **News** | Live market headlines with Bullish/Bearish/Neutral sentiment tags |
| **AI Advisor** | Daily short-term picks, long-term compounders, avoid list, and Nifty weekly direction |

## How it works

Real numbers in, interpretation out. The app pulls live data from public sources and computes
technicals (RSI, MACD, Bollinger, MA, support/resistance) and a composite score locally. Gemini is
fed the **real** data and asked only to interpret it — so prices and signals are never hallucinated.

- **Stock universe** — fetched live from NSE (no hardcoded list)
- **Prices** — Yahoo Finance, fetched in rolling chunks of 50 via racing CORS proxies, rendered progressively
- **FII/DII & option chain** — NSE India
- **News** — GNews API
- **State** — Zustand; **data fetching** — TanStack Query; **virtualization** — TanStack Virtual

A persistent **DataStatusBar** shows per-source load state in real time so you always know what's live.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Recharts · Zustand · TanStack Query/Virtual · Google Gemini 2.5 Flash

## Local development

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
npm run preview  # preview the build
```

### Environment variables

Create a `.env` file (or set GitHub Actions secrets for deploys):

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes | AI analysis & advisor — [Google AI Studio](https://aistudio.google.com) (free tier) |
| `GNEWS_API_KEY` | Optional | Live news feed — [gnews.io](https://gnews.io) (free 100 req/day) |

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the app and publishes it to
GitHub Pages. Ensure the repo's **Pages → Source** is set to **GitHub Actions**.

---

> Disclaimer: All analysis is informational and AI-assisted. It is not financial advice. Always do your own research.

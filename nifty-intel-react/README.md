# NIFTY-INTEL React Rewrite

Modern React 18 + TypeScript + Vite rebuild of NIFTY-INTEL stock screener application.

## Quick Start

```bash
npm install
npm run dev        # Dev server on http://localhost:5173
npm run build      # Production bundle
npm run preview    # Preview production build
```

## Tech Stack

- **React 18** — UI framework
- **TypeScript** — strict type safety
- **Vite** — lightning-fast bundler
- **Zustand** — lightweight state management
- **React Query** — data fetching & caching
- **Recharts** — interactive financial charts
- **Tailwind CSS** — utility-first styling

## Architecture

### State Management
- **Zustand store** (`src/store/stockStore.ts`) — global stock list, filters, FNO positions, watchlist
- **React Query** — server state (data fetching, caching)

### Services
- **yahooService.ts** — CORS-proxied Yahoo Finance quotes & history
- **geminiFetcher.ts** — Google Gemini API for AI analysis (pending)
- **newsService.ts** — News sentiment integration (pending)

### Utilities
- **mathEngine.ts** — RSI, MACD, SMA, ATR, historical volatility, pivots
- **scoringEngine.ts** — Stock scoring & grading logic
- **rationaleEngine.ts** — Technical & fundamental signal generation

### Features
- **Screener** — 500-stock table with real-time filters, sorting, detail modal, price charts
- **Strategy** — Iron Condor builder with Black-Scholes Greeks
- **Long-Term** — 100 fundamental picks with D/E, ROE filtering
- **Post-Market** — Daily summary with AI narrative generation

## Development

### Project Structure
```
src/
├── components/
│   ├── Screener/      # Stock table, modal, filters
│   ├── Strategy/      # F&O position builder
│   ├── LongTerm/      # Fundamental picks list
│   ├── PostMarket/    # Daily summary
│   └── Common/        # Chart, loader, toast, error boundary
├── services/          # API clients
├── hooks/            # Custom React hooks
├── store/            # Zustand stores
├── utils/            # Math engines, scoring
├── types/            # TypeScript interfaces
├── data/             # Static data (NIFTY500, lot sizes)
└── styles/           # Global CSS
```

### Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Type Safety
```bash
npm run type-check    # Verify TypeScript (if configured)
```

## Performance

- Bundle size target: <500KB gzipped
- Dev server: instant HMR
- Data fetching: parallel batch requests (250 stocks per batch)
- Virtual scrolling: only render ~20-30 visible table rows

## Deployment

### Docker
```bash
docker-compose up    # Runs on http://localhost:3000
```

### Static Hosting (Vercel, Netlify, GitHub Pages)
```bash
npm run build
# Deploy dist/ folder
```

## Migration from Vanilla

Old codebase remains in `js/` folder as reference.
- **mathEngine** → `src/utils/mathEngine.ts`
- **state.js** → `src/store/stockStore.ts`
- **yahooFetcher.js** → `src/services/yahooService.ts`
- **sections/*.js** → `src/components/*/`

## Roadmap

- [ ] Phase 2: Complete state management & React Query setup
- [ ] Phase 3: Recharts integration for all charts
- [ ] Phase 4: Refactor Screener, Strategy, LongTerm, PostMarket components
- [ ] Phase 5: Testing, Docker, production build optimization
- [ ] News sentiment integration
- [ ] Multi-asset support (NSE + BSE + crypto)
- [ ] Dark mode
- [ ] User accounts

## Known Limitations

- News API integration pending
- Multi-exchange support (future phase)
- Dark mode planned but not implemented

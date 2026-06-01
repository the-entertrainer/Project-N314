# Phase 5: Build, Test & Deploy

## Testing

### Run Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

### Test Structure

Tests are organized alongside source files in `__tests__` directories:

- `src/utils/__tests__/mathEngine.test.ts` — Technical indicators (RSI, MACD, SMA, ATR, volatility, MA trends)
- `src/utils/__tests__/scoringEngine.test.ts` — Stock scoring (0-100) and grade assignment (A-F)
- `src/store/__tests__/stockStore.test.ts` — Zustand state management (setStocks, patchStocks, watchlist, filters)

### Test Coverage

Focus areas:
- ✅ Math engine calculations (RSI, ATR, SMA, volatility, trend identification)
- ✅ Scoring logic (fundamental + technical scores, grade mapping)
- ✅ Store actions (stock CRUD, watchlist, error handling)
- Component snapshots (visual regressions)
- Hook behavior (data fetching, filter application)

Run with coverage report:
```bash
npm run test -- --coverage
```

Reports generated in `coverage/` directory. Open `coverage/index.html` in browser.

---

## Production Build

### Build Command

```bash
npm run build
```

This runs:
1. TypeScript type checking (`tsc -b`)
2. Vite bundling with optimizations
3. Generates `dist/` directory ready for production

### Build Output

Expected bundle size: **<500KB gzipped**

Optimize if needed:
- Tree-shake unused code
- Lazy load heavy components (future: code-splitting with React.lazy)
- Minify CSS/JS (automatic via Vite)
- Compress images (in assets)

### Build Verification

```bash
npm run preview
```

Locally serves the production build on http://localhost:4173. Test all features:
- ✅ Data loads within 2 seconds
- ✅ Charts render smoothly
- ✅ Filters work without lag
- ✅ Modal opens quickly
- ✅ No console errors or warnings
- ✅ Responsive on mobile (375px width)

---

## Docker Containerization

### Build Docker Image

```bash
docker build -t nifty-intel:latest .
```

### Run Locally

```bash
docker run -p 3000:3000 -e GEMINI_API_KEY=your-key nifty-intel:latest
```

Visit: http://localhost:3000

### Docker Compose (Recommended)

Create `.env` file:
```bash
cp .env.example .env
# Edit .env and add GEMINI_API_KEY
```

Start the app:
```bash
docker-compose up -d
```

Stop:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f nifty-intel
```

### Health Check

Docker includes a health check that pings the app every 30 seconds. View status:
```bash
docker-compose ps
```

---

## Deployment Options

### 1. Vercel (Recommended for Speed)

Deploy directly from Git:

```bash
npm install -g vercel
vercel
```

- Auto-detects Vite config
- Zero-config deployment
- CDN edge caching
- Environment variables via dashboard
- Auto-deploys on push

### 2. Railway / Render (Docker-based)

Both services auto-detect Dockerfile and deploy:

**Railway:**
- Connect GitHub repo
- Set environment variables in dashboard
- Deploy with one click

**Render:**
- Same as Railway, very similar UX

### 3. Self-Hosted (VPS / Server)

Deploy to Ubuntu/Debian server:

```bash
# 1. Install Docker & Docker Compose
sudo apt-get install docker.io docker-compose

# 2. Clone repo
git clone <repo-url>
cd nifty-intel-react

# 3. Set environment
cp .env.example .env
nano .env  # Edit with API keys

# 4. Start app
docker-compose up -d

# 5. Setup Nginx reverse proxy (optional)
# Point domain to :3000
```

With Nginx:
```nginx
server {
    listen 80;
    server_name nifty-intel.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. GitHub Pages (Static)

Export `dist/` as static site:

```bash
npm run build
# Push dist/ to gh-pages branch
git subtree push --prefix dist/ origin gh-pages
```

⚠️ API calls require CORS proxy or backend. Not recommended for this app.

---

## Performance Checklist

Before production deployment, verify:

- [ ] **Bundle Size:** `npm run build` output <500KB gzipped
- [ ] **Data Loading:** 500 stocks load within 2 seconds
- [ ] **Chart Rendering:** Interactive chart loads <1s in modal
- [ ] **Interactivity:** No lag on filter changes or sorting
- [ ] **F&O Strategy:** Iron Condor calculations instant
- [ ] **Mobile Responsive:** Fully functional at 375px width
- [ ] **Dark Mode:** Colors remain readable (if implemented)
- [ ] **Console:** No errors, warnings, or console.logs
- [ ] **TypeScript:** `tsc -b` passes without errors
- [ ] **Tests:** `npm run test` passes 100%
- [ ] **Build:** `npm run build` completes without errors
- [ ] **Docker:** `docker-compose up` runs successfully
- [ ] **API Keys:** GEMINI_API_KEY set in environment
- [ ] **CORS:** No CORS errors from Yahoo Finance proxies
- [ ] **Accessibility:** Keyboard navigation works, colors have sufficient contrast

---

## Environment Variables

### Development (.env.local)

```bash
VITE_GEMINI_API_KEY=your-dev-key
```

### Production (Docker / Vercel / Railway)

Set via:
- Docker: `docker-compose up` reads from `.env`
- Vercel: Environment Variables dashboard
- Railway: Variables panel
- Self-hosted: Edit `.env` file

⚠️ Never commit `.env` with real keys. Use `.env.example` as template.

---

## Monitoring & Logs

### Docker Logs

```bash
docker-compose logs -f nifty-intel
```

### Production Monitoring

- **Vercel:** Built-in analytics and error tracking
- **Railway / Render:** App logs in dashboard
- **Self-hosted:** Use PM2 or systemd to monitor process

```bash
# PM2 example
pm2 start "npm run preview" --name nifty-intel
pm2 logs nifty-intel
```

---

## Rollback

### Vercel / Railway
One-click revert to previous deployment in dashboard.

### Docker
```bash
docker-compose pull  # Get latest image
docker-compose up -d  # Re-deploy
docker-compose down  # Rollback to previous
```

### Git
```bash
git revert <commit-hash>
git push
# CI/CD re-deploys automatically
```

---

## What's Next

After Phase 5 completion:

1. **News Integration** — Fetch recent news, sentiment analysis via Gemini
2. **Dark Mode** — Add settings store toggle, Tailwind dark: class
3. **Multi-Asset** — Support US stocks (Yahoo Finance), crypto (CoinGecko)
4. **User Accounts** — Firebase Auth for watchlist persistence
5. **Advanced Charts** — Add technical analysis overlays, Ichimoku, Fibonacci
6. **Notifications** — Alert user when stock hits watchlist price
7. **Mobile App** — React Native version for iOS/Android

---

## Quick Reference

```bash
# Development
npm run dev          # Start dev server :5173

# Testing
npm run test         # Run all tests
npm run test:watch   # Watch mode

# Build & Preview
npm run build        # Production build
npm run preview      # Preview production locally

# Docker
docker-compose up -d   # Start containerized app
docker-compose logs -f # View logs
docker-compose down    # Stop app
```

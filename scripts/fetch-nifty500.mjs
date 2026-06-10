import https from 'https';
import fs from 'fs';

https.get(
  'https://archives.nseindia.com/content/indices/ind_nifty500list.csv',
  { headers: { 'User-Agent': 'Mozilla/5.0' } },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      const lines = data.trim().split(/\r?\n/).slice(1);
      const stocks = lines
        .map((line) => {
          const parts = [];
          let cur = '';
          let inQ = false;
          for (const ch of line) {
            if (ch === '"') {
              inQ = !inQ;
              continue;
            }
            if (ch === ',' && !inQ) {
              parts.push(cur);
              cur = '';
              continue;
            }
            cur += ch;
          }
          parts.push(cur);
          const [companyName, industry, symbol] = parts;
          if (!symbol?.trim()) return null;
          return {
            symbol: `${symbol.trim()}.NS`,
            companyName: companyName.trim(),
            industry: (industry || '').trim(),
          };
        })
        .filter(Boolean);

      fs.mkdirSync('data', { recursive: true });
      fs.writeFileSync('data/nifty500.json', JSON.stringify(stocks));
      console.log(`Written ${stocks.length} stocks`);
    });
  }
);
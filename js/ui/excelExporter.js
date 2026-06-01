import State from '../state.js';
import MathEngine from '../engines/mathEngine.js';

export class ExcelExporter {
  static async generate() {
    if (!window.XLSX) {
      console.warn('SheetJS CDN unavailable, attempting fallback...');
      throw new Error('SheetJS not available. Excel export unavailable at this time.');
    }
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();
    const date = new Date().toISOString().split('T')[0];

    // Sheet 1: Dashboard
    const nifty = State.niftyData;
    const fno = State.fnoCache || {};
    const dashData = [
      ['NIFTY INTEL — Daily Report', date],
      [],
      ['Nifty Level', nifty?.cmp || 'N/A', 'Change', nifty?.changePercent ? `${nifty.changePercent.toFixed(2)}%` : 'N/A'],
      ['India VIX', fno.vix || 'N/A', 'PCR', fno.pcr || 'N/A'],
      ['FII Net (Equity)', fno.fiiNetEquity ? `₹${fno.fiiNetEquity}Cr` : 'N/A', 'DII Net', fno.diiNetEquity ? `₹${fno.diiNetEquity}Cr` : 'N/A'],
      ['Max Pain', fno.maxPain || 'N/A', 'Data Source', fno.source || 'LIVE'],
      [],
      ['TOP 10 STOCKS BY SCORE'],
      ['Rank', 'Ticker', 'Name', 'CMP', 'Change%', 'Score', 'Grade', 'RSI', 'Trend', 'Sector'],
    ];
    const top10 = State.getTopN(10);
    top10.forEach((s, i) => dashData.push([
      i + 1, s.ticker, s.name, s.cmp, s.returnDaily, s.score, s.grade, s.rsi, s.trend, s.sector
    ]));
    const ws1 = XLSX.utils.aoa_to_sheet(dashData);
    this._styleSheet(ws1, { 'A1': { font: { bold: true, sz: 16 } } });
    XLSX.utils.book_append_sheet(wb, ws1, 'Dashboard');

    // Sheet 2: Nifty500_Screener
    const allStocks = [...State.stocks.values()].sort((a, b) => (b.score || 0) - (a.score || 0));
    const screenerHeaders = ['Rank', 'Ticker', 'Name', 'Sector', 'CMP', 'Change%', '52W High', '52W Low',
      'Score', 'Grade', 'RSI', 'MACD', 'Trend', 'Support1', 'Resistance1',
      'P/E', 'P/B', 'Market Cap', 'ROE%', 'Margin%', 'D/E', '1M Return%', '1Y Return%', 'F&O', 'Inst.Flag'];
    const screenerRows = [screenerHeaders];
    allStocks.forEach((s, i) => screenerRows.push([
      i + 1, s.ticker, s.name, s.sector, s.cmp, s.returnDaily?.toFixed(2), s.high52w, s.low52w,
      s.score, s.grade, s.rsi?.toFixed(1), s.macd?.toFixed(2), s.trend, s.support1?.toFixed(0), s.resistance1?.toFixed(0),
      s.pe?.toFixed(1), s.pb?.toFixed(1), s.marketCap, s.roe?.toFixed(1), s.profitMargin?.toFixed(1),
      s.debtEquity?.toFixed(2), s.returnMonthly?.toFixed(2), s.return1y?.toFixed(2),
      s.isFno ? 'Y' : 'N', s.institutionalFlag ? 'Y' : 'N'
    ]));
    const ws2 = XLSX.utils.aoa_to_sheet(screenerRows);
    const lastCol = String.fromCharCode(64 + screenerHeaders.length);
    ws2['!autofilter'] = { ref: `A1:${lastCol}${screenerRows.length}` };
    XLSX.utils.book_append_sheet(wb, ws2, 'Nifty500_Screener');

    // Sheet 3: Top50_Ranked
    const top50 = allStocks.slice(0, 50);
    const top50Headers = ['Rank', 'Ticker', 'Name', 'Score', 'Grade', 'CMP', 'P/E', 'ROE%', 'Margin%', 'D/E',
      'RSI', 'Trend', 'Support', 'Resistance', 'F&O', 'Recommendation'];
    const top50Rows = [top50Headers];
    top50.forEach((s, i) => top50Rows.push([
      i + 1, s.ticker, s.name, s.score, s.grade, s.cmp, s.pe?.toFixed(1), s.roe?.toFixed(1),
      s.profitMargin?.toFixed(1), s.debtEquity?.toFixed(2), s.rsi?.toFixed(1), s.trend,
      s.support1?.toFixed(0), s.resistance1?.toFixed(0), s.isFno ? 'Y' : 'N',
      s.rationale?.recommendationBasis || ''
    ]));
    const ws3 = XLSX.utils.aoa_to_sheet(top50Rows);
    ws3['!autofilter'] = { ref: `A1:P${top50Rows.length}` };
    XLSX.utils.book_append_sheet(wb, ws3, 'Top50_Ranked');

    // Sheet 4: LongTerm_Picks
    const lt = State.longTermList;
    const ltHeaders = ['#', 'Ticker', 'Name', 'Sector', 'CMP', 'Buy Zone', 'Grade', 'Moat', 'Valuation', 'Technical Entry', '10Y Thesis', 'Key Risks'];
    const ltRows = [ltHeaders];
    lt.forEach((s, i) => ltRows.push([
      i + 1, s.ticker, s.name, s.sector, s.cmp, s.buyZone, s.grade,
      s.moat, s.valuationCase, s.technicalEntry, s.tenYearThesis,
      Array.isArray(s.risks) ? s.risks.join('; ') : s.risks || ''
    ]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ltRows), 'LongTerm_Picks');

    // Sheet 5: FnO_Positions
    const pos = State.fnoPositions;
    const posHeaders = ['ID', 'Underlying', 'Strategy', 'Entry Date', 'Expiry', 'Strikes', 'Credit', 'Current P&L', 'Max Profit', 'Max Loss', 'Status'];
    const posRows = [posHeaders];
    pos.forEach(p => posRows.push([
      p.id, p.underlying, p.type, p.entryDate, p.expiry,
      p.type === 'IRON_CONDOR' ? `${p.sellPut}/${p.sellCall} / ${p.buyPut}/${p.buyCall}` : `${p.strikeSell}/${p.strikeBuy}`,
      p.credit?.toFixed(2), p.currentPnl?.toFixed(2), p.maxProfit?.toFixed(2), p.maxLoss?.toFixed(2), p.status || ''
    ]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(posRows), 'FnO_Positions');

    // Sheet 6: Strategy_Plan
    const strategyRows = [
      ['NIFTY INTEL — Next-Day Strategy Plan', date],
      [],
      ['PIVOT LEVELS'],
      ['Pivot', 'R1', 'R2', 'R3', 'S1', 'S2', 'S3'],
    ];
    const nd = State.niftyData;
    if (nd?.rawPrices?.length >= 5) {
      const prices = nd.rawPrices;
      const n = prices.length;
      const high = Math.max(...prices.slice(-5));
      const low = Math.min(...prices.slice(-5));
      const close = prices[n - 1];
      const p = MathEngine.calculatePivots(high, low, close);
      strategyRows.push([p.pivot?.toFixed(0), p.r1?.toFixed(0), p.r2?.toFixed(0), p.r3?.toFixed(0), p.s1?.toFixed(0), p.s2?.toFixed(0), p.s3?.toFixed(0)]);
    } else if (fno.niftyClose) {
      strategyRows.push(['N/A — no OHLC data; Nifty last close: ' + fno.niftyClose]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(strategyRows), 'Strategy_Plan');

    // Sheet 7: PostMarket_Log
    const log = State.postMarketLog.slice(0, 30);
    const logHeaders = ['Date', 'Nifty Change', 'Top Gainer', 'Top Loser', 'Notes'];
    const logRows = [logHeaders];
    log.forEach(l => logRows.push([
      new Date(l.timestamp).toLocaleDateString('en-IN'), l.niftyChange, l.topGainer, l.topLoser, l.notes || ''
    ]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(logRows), 'PostMarket_Log');

    const filename = `NIFTY_INTEL_${date}.xlsx`;
    XLSX.writeFile(wb, filename);
    return filename;
  }

  static _styleSheet(ws, styles) {
    for (const [cell, style] of Object.entries(styles)) {
      if (!ws[cell]) ws[cell] = {};
      ws[cell].s = style;
    }
  }
}

export default ExcelExporter;

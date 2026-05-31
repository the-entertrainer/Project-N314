export class ChartRenderer {
  static renderPriceChart(containerId, stock) {
    if (!window.Plotly || !stock?.rawPrices?.length) return;
    const prices = stock.rawPrices;
    const dates = stock.rawDates;
    const n = prices.length;

    const traces = [
      {
        x: dates, y: prices, type: 'scatter', mode: 'lines',
        name: 'Price', line: { color: '#3b82f6', width: 2 },
        hovertemplate: '₹%{y:.2f}<extra></extra>',
      }
    ];

    if (stock.support1) {
      traces.push({
        x: [dates[0], dates[n - 1]], y: [stock.support1, stock.support1],
        mode: 'lines', name: 'Support', line: { color: '#10b981', dash: 'dot', width: 1 },
      });
    }
    if (stock.resistance1) {
      traces.push({
        x: [dates[0], dates[n - 1]], y: [stock.resistance1, stock.resistance1],
        mode: 'lines', name: 'Resistance', line: { color: '#ef4444', dash: 'dot', width: 1 },
      });
    }

    const layout = {
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#9ca3af', size: 11 },
      xaxis: { gridcolor: '#374151', showgrid: true, type: 'date' },
      yaxis: { gridcolor: '#374151', showgrid: true, title: 'Price (₹)' },
      margin: { t: 30, b: 40, l: 60, r: 20 },
      showlegend: false, height: 250,
    };

    Plotly.newPlot(containerId, traces, layout, { responsive: true, displayModeBar: false });
  }

  static renderRSIChart(containerId, stock) {
    if (!window.Plotly || !stock?.rawPrices?.length) return;
    const dates = stock.rawDates;
    const prices = stock.rawPrices;

    const { MathEngine } = window._engines || {};
    if (!MathEngine) return;

    const rsiArr = MathEngine.calculateRSI(prices);
    const rsiClean = rsiArr.map((v, i) => ({ x: dates[i], y: v })).filter(p => p.y !== null);

    const traces = [
      {
        x: rsiClean.map(p => p.x), y: rsiClean.map(p => p.y),
        type: 'scatter', mode: 'lines', name: 'RSI',
        line: { color: '#a78bfa', width: 2 },
        hovertemplate: '%{y:.1f}<extra></extra>',
      },
      { x: [dates[0], dates[dates.length - 1]], y: [70, 70], mode: 'lines', showlegend: false, line: { color: '#ef4444', dash: 'dot', width: 1 } },
      { x: [dates[0], dates[dates.length - 1]], y: [30, 30], mode: 'lines', showlegend: false, line: { color: '#10b981', dash: 'dot', width: 1 } },
    ];

    const layout = {
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#9ca3af', size: 11 },
      xaxis: { gridcolor: '#374151', type: 'date' },
      yaxis: { gridcolor: '#374151', range: [0, 100], title: 'RSI' },
      margin: { t: 20, b: 40, l: 55, r: 20 },
      showlegend: false, height: 180,
    };

    Plotly.newPlot(containerId, traces, layout, { responsive: true, displayModeBar: false });
  }

  static renderNiftyOverview(containerId, niftyData) {
    if (!window.Plotly) return;
    const prices = niftyData?.prices || [];
    const dates = niftyData?.dates || [];
    if (!prices.length) return;

    const trace = {
      x: dates, y: prices, type: 'scatter', mode: 'lines',
      fill: 'tozeroy', fillcolor: 'rgba(59,130,246,0.1)',
      line: { color: '#3b82f6', width: 2 },
    };

    const layout = {
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#9ca3af', size: 10 },
      xaxis: { gridcolor: '#374151', type: 'date' },
      yaxis: { gridcolor: '#374151' },
      margin: { t: 10, b: 30, l: 55, r: 10 },
      showlegend: false, height: 160,
    };

    Plotly.newPlot(containerId, [trace], layout, { responsive: true, displayModeBar: false });
  }

  static renderSectorHeatmap(containerId, stocks) {
    if (!window.Plotly || !stocks?.length) return;
    const sectorMap = {};
    for (const s of stocks) {
      if (!sectorMap[s.sector]) sectorMap[s.sector] = { total: 0, count: 0 };
      if (s.returnDaily !== null && s.returnDaily !== undefined) {
        sectorMap[s.sector].total += s.returnDaily;
        sectorMap[s.sector].count++;
      }
    }
    const sectors = Object.keys(sectorMap);
    const values = sectors.map(k => sectorMap[k].count > 0 ? sectorMap[k].total / sectorMap[k].count : 0);

    const trace = {
      type: 'bar',
      x: values,
      y: sectors,
      orientation: 'h',
      marker: {
        color: values.map(v => v >= 0 ? '#10b981' : '#ef4444'),
      },
      text: values.map(v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`),
      textposition: 'outside',
      hovertemplate: '%{y}: %{x:.2f}%<extra></extra>',
    };

    const layout = {
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#9ca3af', size: 10 },
      xaxis: { gridcolor: '#374151', title: 'Avg Change %' },
      yaxis: { automargin: true },
      margin: { t: 10, b: 40, l: 120, r: 60 },
      height: 350,
    };

    Plotly.newPlot(containerId, [trace], layout, { responsive: true, displayModeBar: false });
  }

  static renderPnLBar(containerId, positions) {
    if (!window.Plotly || !positions?.length) return;
    const labels = positions.map(p => `${p.underlying} ${p.type}`);
    const values = positions.map(p => p.currentPnl || 0);

    const trace = {
      type: 'bar',
      x: labels,
      y: values,
      marker: { color: values.map(v => v >= 0 ? '#10b981' : '#ef4444') },
      text: values.map(v => `₹${v.toFixed(0)}`),
      textposition: 'outside',
    };

    const layout = {
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { color: '#9ca3af', size: 11 },
      xaxis: { tickangle: -30 },
      yaxis: { gridcolor: '#374151', title: 'P&L (₹)' },
      margin: { t: 20, b: 80, l: 70, r: 20 },
      height: 260,
    };

    Plotly.newPlot(containerId, [trace], layout, { responsive: true, displayModeBar: false });
  }
}

export default ChartRenderer;

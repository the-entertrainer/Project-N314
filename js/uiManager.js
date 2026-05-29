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

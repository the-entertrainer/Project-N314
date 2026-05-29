export class UiManager {
  static initializeChart() {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) {
      console.error('Chart container not found');
      return;
    }
    chartContainer.innerHTML = '<p class="text-gray-400 text-center py-8">Select a ticker and run analysis to view charts</p>';
  }

  static renderCharts(dates, prices, sma50, sma200, rsi, macd, forecast, forecastDates) {
    if (!Plotly) {
      this.showToast('Plotly library not loaded', 'error');
      return;
    }

    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;

    this._renderPriceChart(dates, prices, sma50, sma200, forecast, forecastDates);
    this._renderTechnicalIndicators(dates, rsi, macd);
  }

  static _renderPriceChart(dates, prices, sma50, sma200, forecast, forecastDates) {
    const tracePrice = {
      x: dates,
      y: prices,
      mode: 'lines',
      name: 'Price',
      line: { color: '#3b82f6', width: 2 }
    };

    const traceSma50 = {
      x: dates,
      y: sma50,
      mode: 'lines',
      name: 'SMA 50',
      line: { color: '#f97316', width: 1.5, dash: 'dash' }
    };

    const traceSma200 = {
      x: dates,
      y: sma200,
      mode: 'lines',
      name: 'SMA 200',
      line: { color: '#ef4444', width: 1.5, dash: 'dash' }
    };

    const traceForecast = {
      x: forecastDates,
      y: forecast,
      mode: 'lines+markers',
      name: 'Forecast (7d)',
      line: { color: '#10b981', width: 2, dash: 'dot' },
      marker: { size: 6 }
    };

    const data = [tracePrice, traceSma50, traceSma200, traceForecast];

    const layout = {
      title: 'Price Action & Forecasts',
      xaxis: { title: 'Date' },
      yaxis: { title: 'Price ($)' },
      template: 'plotly_dark',
      margin: { l: 50, r: 50, t: 50, b: 50 },
      autosize: true,
      hovermode: 'x unified'
    };

    Plotly.newPlot('chart-price', data, layout, { responsive: true });
  }

  static _renderTechnicalIndicators(dates, rsi, macd) {
    const traces = [];

    const rsiTrace = {
      x: dates,
      y: rsi,
      mode: 'lines',
      name: 'RSI (14)',
      line: { color: '#8b5cf6', width: 2 },
      yaxis: 'y1'
    };
    traces.push(rsiTrace);

    const macdTrace = {
      x: dates,
      y: macd.macd,
      mode: 'lines',
      name: 'MACD',
      line: { color: '#06b6d4', width: 1.5 },
      yaxis: 'y2'
    };
    traces.push(macdTrace);

    const signalTrace = {
      x: dates,
      y: macd.signal,
      mode: 'lines',
      name: 'Signal',
      line: { color: '#ec4899', width: 1.5, dash: 'dot' },
      yaxis: 'y2'
    };
    traces.push(signalTrace);

    const layout = {
      title: 'Technical Indicators',
      xaxis: { title: 'Date' },
      yaxis: { title: 'RSI', side: 'left' },
      yaxis2: { title: 'MACD', overlaying: 'y', side: 'right' },
      template: 'plotly_dark',
      margin: { l: 50, r: 50, t: 50, b: 50 },
      autosize: true,
      hovermode: 'x unified'
    };

    Plotly.newPlot('chart-indicators', traces, layout, { responsive: true });
  }

  static updateMetrics(ticker, currentPrice, change, changePercent, rsi, mathTarget, action, confidence, sentiment) {
    const metricsContainer = document.getElementById('metrics-container');
    if (!metricsContainer) return;

    const changeColor = change >= 0 ? 'text-green-400' : 'text-red-400';
    const actionColor = action === 'BUY' ? 'bg-green-500' : action === 'SELL' ? 'bg-red-500' : 'bg-yellow-500';

    metricsContainer.innerHTML = `
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="bg-gray-800 p-4 rounded">
          <p class="text-gray-400 text-sm">Ticker</p>
          <p class="text-2xl font-bold text-white">${ticker}</p>
        </div>
        <div class="bg-gray-800 p-4 rounded">
          <p class="text-gray-400 text-sm">Price</p>
          <p class="text-2xl font-bold text-white">$${currentPrice.toFixed(2)}</p>
          <p class="${changeColor} text-sm mt-1">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)</p>
        </div>
        <div class="bg-gray-800 p-4 rounded">
          <p class="text-gray-400 text-sm">RSI (14)</p>
          <p class="text-2xl font-bold text-white">${rsi.toFixed(1)}</p>
          <p class="text-gray-400 text-xs mt-1">${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}</p>
        </div>
        <div class="bg-gray-800 p-4 rounded">
          <p class="text-gray-400 text-sm">Math Target</p>
          <p class="text-2xl font-bold text-white">$${mathTarget.toFixed(2)}</p>
          <p class="text-gray-400 text-xs mt-1">${((mathTarget - currentPrice) / currentPrice * 100).toFixed(1)}% upside</p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-800 p-4 rounded">
          <p class="text-gray-400 text-sm">AI Recommendation</p>
          <div class="mt-2">
            <span class="${actionColor} text-white px-4 py-2 rounded font-bold text-lg inline-block">${action}</span>
          </div>
        </div>
        <div class="bg-gray-800 p-4 rounded">
          <p class="text-gray-400 text-sm">Confidence</p>
          <p class="text-2xl font-bold text-white">${(confidence * 100).toFixed(0)}%</p>
          <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div class="bg-blue-500 h-2 rounded-full" style="width: ${confidence * 100}%"></div>
          </div>
        </div>
        <div class="bg-gray-800 p-4 rounded">
          <p class="text-gray-400 text-sm">Sentiment Score</p>
          <p class="text-2xl font-bold ${sentiment >= 0 ? 'text-green-400' : 'text-red-400'}">${sentiment >= 0 ? '+' : ''}${sentiment.toFixed(2)}</p>
          <p class="text-gray-400 text-xs mt-1">${sentiment > 0.5 ? 'Bullish' : sentiment < -0.5 ? 'Bearish' : 'Neutral'}</p>
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
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-0 right-0 m-4 z-50 space-y-2';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
    toast.className = `${bgColor} text-white px-6 py-3 rounded shadow-lg animate-fadeIn max-w-xs`;
    toast.textContent = message;

    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  static clearMetrics() {
    const metricsContainer = document.getElementById('metrics-container');
    if (metricsContainer) {
      metricsContainer.innerHTML = '<p class="text-gray-400 text-center py-8">Run analysis to see metrics</p>';
    }
  }

  static hideCharts() {
    const chartPrice = document.getElementById('chart-price');
    const chartIndicators = document.getElementById('chart-indicators');
    if (chartPrice) Plotly.purge('chart-price');
    if (chartIndicators) Plotly.purge('chart-indicators');
    this.initializeChart();
  }
}

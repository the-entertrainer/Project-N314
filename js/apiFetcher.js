export class ApiFetcher {
  static async fetchStockData(ticker, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Financial API key not configured. Please set it in Settings.');
    }

    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}&outputsize=full`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      if (data.Note) {
        throw new Error('API rate limit exceeded. Please wait and try again.');
      }

      if (!data['Time Series (Daily)']) {
        throw new Error(`No data found for ticker: ${ticker}`);
      }

      const timeSeries = data['Time Series (Daily)'];
      const dates = Object.keys(timeSeries).sort();
      const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));

      if (prices.some(p => isNaN(p))) {
        throw new Error('Invalid price data received from API');
      }

      return {
        ticker,
        dates,
        prices,
        currentPrice: prices[prices.length - 1],
        previousClose: prices.length > 1 ? prices[prices.length - 2] : prices[prices.length - 1]
      };
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Network error or CORS issue. Please check your connection and API key.');
      }
      throw error;
    }
  }

  static async fetchCurrentPrice(ticker, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Financial API key not configured.');
    }

    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
        throw new Error(`No quote data found for ${ticker}`);
      }

      const quote = data['Global Quote'];
      return {
        ticker,
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent']),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Network error or CORS issue fetching current price.');
      }
      throw error;
    }
  }

  static validateApiKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is empty');
    }
    if (apiKey.length < 10) {
      throw new Error('API key appears to be invalid (too short)');
    }
    return true;
  }

  static validateTicker(ticker) {
    if (!ticker || ticker.trim() === '') {
      throw new Error('Ticker symbol is empty');
    }
    const trimmed = ticker.trim().toUpperCase();
    if (!/^[A-Z]{1,5}$/.test(trimmed)) {
      throw new Error('Invalid ticker symbol format');
    }
    return trimmed;
  }
}

export class ApiFetcher {
  static async fetchStockData(ticker, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Financial API key not configured. Please set it in Settings.');
    }

    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid API key format. Please check your API key at https://www.alphavantage.co/');
    }

    try {
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}&outputsize=full`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpha Vantage HTTP Error Response:', errorText);

        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API key. Please verify at https://www.alphavantage.co/');
        }
        if (response.status === 429) {
          throw new Error('API rate limit exceeded (5 requests/min). Please wait 60 seconds.');
        }
        throw new Error(`Alpha Vantage API error: HTTP ${response.status}. Check console for details.`);
      }

      let data;
      try {
        data = await response.json();
      } catch (_) {
        const rawText = await response.text().catch(() => 'unreadable');
        throw new Error(`Alpha Vantage returned unexpected response: ${rawText.substring(0, 100)}`);
      }

      if (data['Error Message']) {
        console.error('Alpha Vantage Error Message:', data['Error Message']);
        throw new Error(`API Error: ${data['Error Message']}`);
      }

      if (data.Note) {
        console.warn('Alpha Vantage Note:', data.Note);
        throw new Error('Alpha Vantage rate limit hit (5 req/min, 25 req/day on free tier). Wait 60 seconds or check your daily quota.');
      }

      if (data['Information']) {
        console.warn('Alpha Vantage Information:', data['Information']);
        throw new Error('Alpha Vantage daily limit reached (25 req/day free tier). Get a new key at https://www.alphavantage.co/ or wait 24 hours.');
      }

      if (!data['Time Series (Daily)']) {
        const keys = Object.keys(data);
        const hint = keys.length > 0 ? ` API returned: "${String(data[keys[0]]).substring(0, 100)}"` : '';
        console.error('Alpha Vantage unexpected response:', JSON.stringify(data));
        throw new Error(`No price data for ${ticker}.${hint}`);
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
      if (error.name === 'AbortError') {
        throw new Error('API request timed out (15s). Check your internet connection and try again.');
      }
      if (error instanceof TypeError) {
        console.error('Network/CORS Error:', error.message);
        throw new Error('Network error: Cannot reach Alpha Vantage API. This may be a CORS issue or network problem. Check console for details.');
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

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Alpha Vantage Quote Error:', errorText);
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid API key.');
        }
        throw new Error(`Alpha Vantage error: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data['Error Message']) {
        console.error('Alpha Vantage Error:', data['Error Message']);
        throw new Error(`API Error: ${data['Error Message']}`);
      }

      if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
        console.warn('No quote data found for', ticker, '- response:', data);
        throw new Error(`No quote data found for ${ticker}. Check ticker symbol.`);
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
      if (error.name === 'AbortError') {
        throw new Error('API request timed out (15s). Try again.');
      }
      if (error instanceof TypeError) {
        console.error('Network Error:', error.message);
        throw new Error('Network error: Cannot reach Alpha Vantage API. Check console for details.');
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

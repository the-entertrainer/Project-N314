import { AuthManager } from './auth.js';
import { ApiFetcher } from './apiFetcher.js';
import { MathEngine } from './mathEngine.js';
import { AiController } from './aiController.js';
import { UiManager } from './uiManager.js';

class App {
  constructor() {
    this.currentData = null;
    this.currentAnalysis = null;
  }

  async initialize() {
    try {
      AuthManager.initializeAuth();
      AuthManager.initializeSettingsModal();

      UiManager.initializeChart();
      UiManager.clearMetrics();

      this.attachEventListeners();
    } catch (error) {
      console.error('Initialization error:', error);
      UiManager.showToast('Failed to initialize application', 'error');
    }
  }

  attachEventListeners() {
    const analyzeBtn = document.getElementById('analyze-btn');
    const tickerInput = document.getElementById('ticker-input');

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        this.runAnalysis();
      });
    }

    if (tickerInput) {
      tickerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.runAnalysis();
        }
      });
    }
  }

  async runAnalysis() {
    const tickerInput = document.getElementById('ticker-input');
    if (!tickerInput) return;

    const ticker = tickerInput.value.trim();

    try {
      this.validateInput(ticker);
      await this.executeAnalysisPipeline(ticker);
    } catch (error) {
      UiManager.showToast(error.message, 'error');
    }
  }

  validateInput(ticker) {
    if (!ticker) {
      throw new Error('Please enter a ticker symbol');
    }
    ApiFetcher.validateTicker(ticker);
  }

  async executeAnalysisPipeline(ticker) {
    UiManager.updateLoadingState(true);
    UiManager.clearMetrics();
    UiManager.hideCharts();

    try {
      const financialApiKey = AuthManager.getFinancialApiKey();
      if (!financialApiKey) {
        throw new Error('Financial API key not configured. Please set it in Settings.');
      }

      console.log('[Pipeline] Step 1: Fetching historical data...');
      await this.fetchDataStep(ticker, financialApiKey);

      console.log('[Pipeline] Step 2: Computing technical indicators...');
      await this.computeMathStep();

      console.log('[Pipeline] Step 3: Fetching AI sentiment analysis...');
      await this.fetchAiSentimentStep(ticker);

      console.log('[Pipeline] Step 4: Applying fusion math...');
      await this.applyFusionMathStep();

      console.log('[Pipeline] Step 5: Rendering UI...');
      await this.renderUiStep();

      UiManager.showToast(`Analysis complete for ${ticker}`, 'success');
    } catch (error) {
      console.error('[Pipeline] Error:', error);
      UiManager.hideCharts();
      UiManager.clearMetrics();
      throw error;
    } finally {
      UiManager.updateLoadingState(false);
    }
  }

  async fetchDataStep(ticker, apiKey) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await ApiFetcher.fetchStockData(ticker, apiKey);
        this.currentData = {
          ...data,
          sma50: null,
          sma200: null,
          rsi: null,
          macd: null,
          forecast: null,
          forecastDates: null,
          mathTarget: null,
          sentiment: null
        };
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async computeMathStep() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { prices } = this.currentData;

        this.currentData.sma50 = MathEngine.calculateSMA(prices, 50);
        this.currentData.sma200 = MathEngine.calculateSMA(prices, 200);
        this.currentData.rsi = MathEngine.calculateRSI(prices, 14);

        const macdResult = MathEngine.calculateMACD(prices, 12, 26, 9);
        this.currentData.macd = macdResult;

        const forecast = MathEngine.calculateForecast(prices);
        const lastDate = new Date(this.currentData.dates[this.currentData.dates.length - 1]);
        const forecastDates = [];

        for (let i = 1; i <= 7; i++) {
          const date = new Date(lastDate);
          date.setDate(date.getDate() + i);
          forecastDates.push(date.toISOString().split('T')[0]);
        }

        this.currentData.forecast = forecast;
        this.currentData.forecastDates = forecastDates;

        const currentRsi = this.currentData.rsi[this.currentData.rsi.length - 1];
        const mathTarget = MathEngine.calculateMathTarget(
          this.currentData.currentPrice,
          currentRsi || 50,
          forecast
        );
        this.currentData.mathTarget = mathTarget;

        resolve();
      }, 0);
    });
  }

  async fetchAiSentimentStep(ticker) {
    return new Promise(async (resolve, reject) => {
      try {
        const geminiApiKey = AuthManager.getGeminiApiKey();
        if (!geminiApiKey) {
          throw new Error('Gemini API key not configured. Please set it in Settings.');
        }

        const currentRsi = this.currentData.rsi[this.currentData.rsi.length - 1] || 50;
        const currentMacd = this.currentData.macd.macd[this.currentData.macd.macd.length - 1] || 0;

        const sentiment = await AiController.analyzeSentiment(
          ticker,
          this.currentData.currentPrice,
          currentRsi,
          currentMacd,
          this.currentData.mathTarget,
          geminiApiKey
        );

        this.currentData.sentiment = sentiment;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async applyFusionMathStep() {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!this.currentData.sentiment) {
          resolve();
          return;
        }

        const sentimentWeight = this.currentData.sentiment.ai_confidence_interval;
        const fusedTarget =
          this.currentData.mathTarget * (1 - sentimentWeight) +
          (this.currentData.currentPrice * (1 + this.currentData.sentiment.sentiment_score)) * sentimentWeight;

        this.currentData.mathTarget = fusedTarget;

        resolve();
      }, 0);
    });
  }

  async renderUiStep() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const {
          ticker,
          dates,
          prices,
          currentPrice,
          previousClose,
          sma50,
          sma200,
          rsi,
          macd,
          forecast,
          forecastDates,
          mathTarget,
          sentiment
        } = this.currentData;

        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        UiManager.renderCharts(dates, prices, sma50, sma200, rsi, macd, forecast, forecastDates);
        UiManager.updateMetrics(
          ticker,
          currentPrice,
          change,
          changePercent,
          rsi[rsi.length - 1] || 50,
          mathTarget,
          sentiment.investment_action,
          sentiment.ai_confidence_interval,
          sentiment.sentiment_score
        );

        this.displaySentimentDetail(sentiment);

        resolve();
      }, 0);
    });
  }

  displaySentimentDetail(sentiment) {
    const rationale = document.getElementById('rationale-container');
    if (!rationale) return;

    rationale.innerHTML = `
      <div class="bg-gray-800 p-4 rounded mt-6">
        <h3 class="text-lg font-bold text-white mb-2">Strategic Rationale</h3>
        <p class="text-gray-300">${sentiment.strategic_rationale}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.initialize();
});

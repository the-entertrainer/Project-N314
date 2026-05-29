export class AiController {
  static async analyzeSentiment(ticker, currentPrice, rsi, macd, mathTarget, geminiApiKey) {
    if (!geminiApiKey || geminiApiKey.trim() === '') {
      throw new Error('Gemini API key not configured. Please set it in Settings.');
    }

    try {
      const prompt = this._buildAnalysisPrompt(ticker, currentPrice, rsi, macd, mathTarget);

      const requestPayload = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              sentiment_score: {
                type: 'NUMBER',
                description: 'Score from -1.0 (very bearish) to 1.0 (very bullish)'
              },
              ai_confidence_interval: {
                type: 'NUMBER',
                description: 'Confidence decimal from 0.0 to 1.0'
              },
              investment_action: {
                type: 'STRING',
                enum: ['BUY', 'HOLD', 'SELL']
              },
              strategic_rationale: {
                type: 'STRING',
                description: 'Exactly 2 short sentences explaining the recommendation.'
              }
            },
            required: ['sentiment_score', 'ai_confidence_interval', 'investment_action', 'strategic_rationale']
          }
        }
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('Gemini API error body:', errorBody);
        if (response.status === 400) {
          throw new Error('Gemini API request error. Check console for details.');
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid Gemini API key. Please check your credentials in Settings.');
        }
        if (response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please wait before trying again.');
        }
        throw new Error(`Gemini API error: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        console.error('Gemini response missing candidates:', data);
        throw new Error('No response from Gemini API');
      }

      const candidate = data.candidates[0];
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        console.warn('Gemini finish reason:', candidate.finishReason);
      }

      const content = candidate.content;
      if (!content || !content.parts || content.parts.length === 0) {
        throw new Error('Invalid response format from Gemini API');
      }

      const textContent = content.parts[0].text;
      let parsedResponse;

      try {
        parsedResponse = JSON.parse(textContent);
      } catch (e) {
        console.error('Failed to parse Gemini JSON:', textContent);
        throw new Error('Failed to parse Gemini API JSON response');
      }

      this._validateSentimentResponse(parsedResponse);

      return parsedResponse;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Gemini API request timed out (30s). Please try again.');
      }
      if (error instanceof TypeError) {
        throw new Error('Network error connecting to Gemini API. Please check your connection.');
      }
      throw error;
    }
  }

  static _buildAnalysisPrompt(ticker, currentPrice, rsi, macd, mathTarget) {
    const rsiStr = rsi !== null && rsi !== undefined && !isNaN(rsi) ? Number(rsi).toFixed(2) : 'N/A';
    const macdStr = macd !== null && macd !== undefined && !isNaN(macd) ? Number(macd).toFixed(4) : 'N/A';
    const targetStr = mathTarget !== null && mathTarget !== undefined && !isNaN(mathTarget) ? Number(mathTarget).toFixed(2) : 'N/A';

    return `You are an expert financial analyst with knowledge of market conditions through your training data. Analyze the following stock data for ${ticker} and provide a sentiment-based investment recommendation:

Ticker: ${ticker}
Current Price: $${Number(currentPrice).toFixed(2)}
RSI (14): ${rsiStr}
MACD: ${macdStr}
Mathematical Target: $${targetStr}

Consider recent market conditions, industry trends, and the company's fundamental position. Based on technical indicators and market sentiment, provide:
1. A sentiment score from -1.0 (very bearish) to 1.0 (very bullish)
2. Your confidence level (0.0 to 1.0) in this assessment
3. Investment action: BUY, HOLD, or SELL
4. Strategic rationale in exactly 2 short sentences

Return ONLY valid JSON matching the required schema.`;
  }

  static _validateSentimentResponse(response) {
    if (typeof response.sentiment_score !== 'number' || response.sentiment_score < -1 || response.sentiment_score > 1) {
      throw new Error('Invalid sentiment_score in response');
    }

    if (typeof response.ai_confidence_interval !== 'number' || response.ai_confidence_interval < 0 || response.ai_confidence_interval > 1) {
      throw new Error('Invalid ai_confidence_interval in response');
    }

    if (!['BUY', 'HOLD', 'SELL'].includes(response.investment_action)) {
      throw new Error('Invalid investment_action in response');
    }

    if (typeof response.strategic_rationale !== 'string' || response.strategic_rationale.trim().length === 0) {
      throw new Error('Invalid strategic_rationale in response');
    }
  }
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const TIMEOUT_MS = 45000;

export class GeminiFetcher {
  // Mode 1: Structured JSON — NO tools property
  static async analyzeStructured(prompt, schema, apiKey) {
    if (!apiKey) throw new Error('Gemini API key not configured. Please add it in Settings.');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      };

      const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const data = await this._handleResponse(res);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');
      return JSON.parse(text);
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  // Mode 2: Search Grounding — NO responseMimeType
  static async searchGrounded(prompt, apiKey) {
    if (!apiKey) throw new Error('Gemini API key not configured. Please add it in Settings.');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      };

      const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const data = await this._handleResponse(res);
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  static async _handleResponse(res) {
    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Gemini 400: ${body.error?.message || 'Bad request'}`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('Invalid Gemini API key. Please check Settings.');
    }
    if (res.status === 429) {
      throw new Error('Gemini rate limit hit. Please wait a moment and try again.');
    }
    if (!res.ok) {
      throw new Error(`Gemini API error ${res.status}`);
    }
    return res.json();
  }
}

export default GeminiFetcher;

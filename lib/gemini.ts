const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

export class GeminiRateLimitError extends Error {
  constructor(message = 'Gemini rate limit reached. Please wait a moment and try again.') {
    super(message);
    this.name = 'GeminiRateLimitError';
  }
}

export class GeminiApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new GeminiApiError(
      'GEMINI_API_KEY not configured. Add it in Vercel environment variables.'
    );
  }
  return key;
}

export async function callGeminiReport(
  systemPrompt: string,
  userPayload: string,
  options?: { maxOutputTokens?: number; model?: string }
) {
  const apiKey = getApiKey();
  const model = options?.model || DEFAULT_MODEL;
  const maxOutputTokens = options?.maxOutputTokens ?? 8192;
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPayload }] }],
    generationConfig: {
      temperature: 0.12,
      maxOutputTokens,
      responseMimeType: 'application/json',
    },
  };

  let delay = 1000;
  const retries = 2;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.status === 429) {
      if (attempt === retries) throw new GeminiRateLimitError();
      await sleep(delay);
      delay *= 2;
      continue;
    }

    if (!res.ok) {
      const msg = data.error?.message || `Gemini API error: HTTP ${res.status}`;
      throw new GeminiApiError(msg);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new GeminiApiError('Gemini returned empty response');
    }
    return text as string;
  }

  throw new GeminiRateLimitError();
}
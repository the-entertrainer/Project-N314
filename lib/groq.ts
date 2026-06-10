const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const FAST_MODEL = 'llama-3.1-8b-instant';

export class GroqRateLimitError extends Error {
  constructor(message = 'Groq rate limit reached. Please wait a moment and try again.') {
    super(message);
    this.name = 'GroqRateLimitError';
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function groqRequest(body: Record<string, unknown>, retries = 3): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured. Add it in Vercel environment variables.');
  }

  let delay = 1000;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.status === 429) {
      if (attempt === retries) throw new GroqRateLimitError();
      await sleep(delay);
      delay *= 2;
      continue;
    }

    if (!res.ok) {
      throw new Error(data.error?.message || `Groq API error: HTTP ${res.status}`);
    }

    return data.choices?.[0]?.message?.content || '';
  }

  throw new GroqRateLimitError();
}

export async function callGroq(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { jsonSchema?: object; schemaName?: string; strict?: boolean }
) {
  const body: Record<string, unknown> = {
    model: DEFAULT_MODEL,
    messages,
    temperature: 0.2,
    max_tokens: 4096,
  };

  if (options?.jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: options.schemaName || 'response',
        strict: options.strict ?? true,
        schema: options.jsonSchema,
      },
    };
  }

  return groqRequest(body);
}

export async function callGroqSentiment(
  ticker: string,
  companyName: string,
  industry: string,
  newsPayload: string,
  newsScope: string,
  isMacro: boolean
) {
  const macroInstruction = isMacro
    ? 'News is macro/sector-level. Correlate each macro event to how it specifically impacts this stock.'
    : 'News is company-specific. Base analysis on direct company catalysts.';

  const body = {
    model: FAST_MODEL,
    temperature: 0.1,
    max_tokens: 280,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Financial analyst. Output minified JSON only: {"sentiment":"Bullish|Bearish|Neutral","sentiment_score":number(-1 to 1),"predicted_trend":"string","news_drivers":["a","b","c"]}. Exactly 3 drivers.',
      },
      {
        role: 'user',
        content: `${ticker}|${companyName}|${industry}|scope:${newsScope}|${macroInstruction}\nNEWS:\n${newsPayload}`,
      },
    ],
  };

  return groqRequest(body, 3);
}

export async function callGroqPortfolio(portfolioPayload: string, newsPayload: string) {
  const body = {
    model: FAST_MODEL,
    temperature: 0.15,
    max_tokens: 720,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Portfolio analyst for Indian equities. Minified JSON only: {"portfolio_summary":"str","current_tracking":{"overall_sentiment":"Bullish|Bearish|Neutral","total_pnl_outlook":"str","holdings_snapshot":[{"symbol":"str","status":"str","pnl_view":"str"}]},"predictions":{"short_term_7d":"str","medium_term_30d":"str"},"upcoming_events":[{"event":"str","date_or_timing":"str","impact":"positive|negative|neutral","affected_symbols":["sym"]}],"daily_advice":"str","risk_alerts":["str"]}. Max 4 events, 3 risk alerts.',
      },
      {
        role: 'user',
        content: `PORTFOLIO:\n${portfolioPayload}\nNEWS:\n${newsPayload}`,
      },
    ],
  };

  return groqRequest(body, 3);
}

export async function callGroqPower(systemPrompt: string, userPayload: string, maxTokens = 700) {
  const body = {
    model: FAST_MODEL,
    temperature: 0.15,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPayload },
    ],
  };
  return groqRequest(body, 3);
}

export async function callGroqDailyReport(systemPrompt: string, userPayload: string) {
  const body = {
    model: FAST_MODEL,
    temperature: 0.12,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPayload },
    ],
  };
  return groqRequest(body, 2);
}

export const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['BUY', 'HOLD', 'SELL'] },
    confidence: { type: 'number' },
    price_target_7d: { type: 'number' },
    price_target_30d: { type: 'number' },
    current_sentiment: { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
    headline_summary: { type: 'string' },
    executive_summary: { type: 'string' },
    global_context: { type: 'string' },
    news_impacts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          source: { type: 'string' },
          impact_score: { type: 'number' },
          reasoning: { type: 'string' },
          time_horizon: { type: 'string', enum: ['short', 'medium', 'long'] },
        },
        required: ['headline', 'source', 'impact_score', 'reasoning', 'time_horizon'],
        additionalProperties: false,
      },
    },
    technical_signals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          indicator: { type: 'string' },
          value: { type: 'string' },
          signal: { type: 'string', enum: ['bullish', 'bearish', 'neutral'] },
          weight: { type: 'number' },
        },
        required: ['indicator', 'value', 'signal', 'weight'],
        additionalProperties: false,
      },
    },
    risk_factors: { type: 'array', items: { type: 'string' } },
    catalysts: { type: 'array', items: { type: 'string' } },
    error_margin_pct: { type: 'number' },
    reasoning_chain: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'verdict',
    'confidence',
    'price_target_7d',
    'price_target_30d',
    'current_sentiment',
    'headline_summary',
    'executive_summary',
    'global_context',
    'news_impacts',
    'technical_signals',
    'risk_factors',
    'catalysts',
    'error_margin_pct',
    'reasoning_chain',
  ],
  additionalProperties: false,
};
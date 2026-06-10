const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

export async function callGroq(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options?: { jsonSchema?: object; schemaName?: string; strict?: boolean }
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured. Add it in Vercel environment variables.');
  }

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

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Groq API error: HTTP ${res.status}`);
  }

  return data.choices?.[0]?.message?.content || '';
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
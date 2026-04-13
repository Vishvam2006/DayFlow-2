import { config } from '../../config/index.js';
import { withRetry } from '../../utils/retry.js';

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }

export async function chat(messages: ChatMessage[]): Promise<string> {
  return withRetry(async () => {
    const res = await fetch(`${config.OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://github.com/hrms-bot',
        'X-Title': 'HRMSBot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.LLM_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 400,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`LLM error ${res.status}: ${body}`);
    }
    const data = await res.json();
    return data.choices[0].message.content.trim();
  });
}

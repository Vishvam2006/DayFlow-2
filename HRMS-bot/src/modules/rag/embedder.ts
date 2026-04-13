import { config } from '../../config/index.js';
import { withRetry } from '../../utils/retry.js';

export async function embed(text: string): Promise<number[]> {
  return withRetry(async () => {
    const res = await fetch(`${config.OPENROUTER_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.EMBEDDING_MODEL,
        input: text,
      }),
    });
    if (!res.ok) throw new Error(`Embed error: ${res.status}`);
    const data = await res.json();
    return data.data[0].embedding as number[];
  });
}

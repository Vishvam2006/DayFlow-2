import { getOrCreateSession, updateSession } from '../conversation/session.js';
import { detectLanguage } from '../conversation/language.js';
import { retrieve } from '../rag/retriever.js';
import { chat } from '../llm/client.js';
import { buildSystemPrompt, buildUserMessage } from '../llm/prompts.js';
import { config } from '../../config/index.js';

export async function runPipeline(jid: string, userMessage: string): Promise<string> {
  // 1. Get / create session
  const session = await getOrCreateSession(jid, userMessage);

  // 2. Force language to English
  session.language = 'en';

  // 3. Retrieve relevant KB chunks
  const chunks = await retrieve(userMessage);
  const chunkTexts = chunks.map(c => c.content);

  // 4. Build message array (system + trimmed history + new user msg)
  const systemPrompt = buildSystemPrompt(session.language, config.SHOP_NAME);
  const userContent = buildUserMessage(userMessage, chunkTexts);

  const recentHistory = session.history.slice(-(config.MAX_HISTORY_TURNS * 2))
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...recentHistory,
    { role: 'user' as const, content: userContent },
  ];

  // 5. Call LLM
  const reply = await chat(messages);

  // 6. Persist updated history
  session.history.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: reply }
  );
  await updateSession(session);

  return reply;
}

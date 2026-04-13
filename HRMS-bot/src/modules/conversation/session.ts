import { supabase } from '../../db/client.js';

export interface Session {
  jid: string;
  history: { role: string; content: string }[];
  language: 'en' | 'hi' | 'gu';
}

const cache = new Map<string, Session>();

export async function getOrCreateSession(jid: string, _firstMessage: string): Promise<Session> {
  // Always check in-memory cache first
  if (cache.has(jid)) return cache.get(jid)!;

  // Try to load from Supabase (non-fatal if table doesn't exist yet)
  try {
    const { data } = await supabase.from('sessions').select('*').eq('jid', jid).single();
    if (data) {
      const session: Session = { jid, history: data.history ?? [], language: 'en' };
      cache.set(jid, session);
      return session;
    }
  } catch (err) {
    console.warn('[session] Could not load session from DB (falling back to in-memory):', err);
  }

  // Create a fresh in-memory session
  const session: Session = { jid, history: [], language: 'en' };

  // Try to persist to Supabase (non-fatal)
  try {
    await supabase.from('sessions').insert({ jid, history: [], language: 'en' });
  } catch (err) {
    console.warn('[session] Could not save session to DB (in-memory only):', err);
  }

  cache.set(jid, session);
  return session;
}

export async function updateSession(session: Session) {
  cache.set(session.jid, session);
  // Try to persist history update to Supabase (non-fatal)
  try {
    await supabase
      .from('sessions')
      .upsert({ jid: session.jid, history: session.history, language: session.language, updated_at: new Date().toISOString() });
  } catch (err) {
    console.warn('[session] Could not update session in DB (in-memory only):', err);
  }
}

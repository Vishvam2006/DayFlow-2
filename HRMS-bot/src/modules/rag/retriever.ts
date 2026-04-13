import { supabase } from '../../db/client.js';
import { embed } from './embedder.js';
import { config } from '../../config/index.js';

export interface RetrievedChunk {
  content: string;
  source: string;
  similarity: number;
}

export async function retrieve(query: string): Promise<RetrievedChunk[]> {
  try {
    const embedding = await embed(query);
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: config.SIMILARITY_THRESHOLD,
      match_count: config.TOP_K_CHUNKS,
    });
    if (error) {
      console.error('[retriever] Supabase RPC error:', error.message);
      return [];
    }
    return (data ?? []) as RetrievedChunk[];
  } catch (err) {
    console.error('[retriever] Retrieval failed, proceeding without context:', err);
    return [];
  }
}

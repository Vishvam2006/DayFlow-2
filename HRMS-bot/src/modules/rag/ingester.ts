import fs from 'fs/promises';
import path from 'path';
import { supabase } from '../../db/client.js';
import { embed } from './embedder.js';

const CHUNK_SIZE = 400;
const CHUNK_OVERLAP = 80;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + CHUNK_SIZE));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter(c => c.trim().length > 40);
}

export async function ingestFile(filePath: string) {
  const source = path.basename(filePath);
  const text = await fs.readFile(filePath, 'utf-8');
  const chunks = chunkText(text);

  console.log(`[${source}] ${chunks.length} chunks`);

  for (const chunk of chunks) {
    const embedding = await embed(chunk);
    const { error } = await supabase.from('documents').insert({ content: chunk, embedding, source });
    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }
    process.stdout.write('.');
  }
  console.log('\nDone.');
}

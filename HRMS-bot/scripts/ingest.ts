import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { ingestFile } from '../src/modules/rag/ingester.js';

const KB_DIR = path.join(process.cwd(), 'knowledge-base');

async function main() {
  const files = (await fs.readdir(KB_DIR)).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} knowledge base files.`);
  for (const file of files) {
    await ingestFile(path.join(KB_DIR, file));
  }
  console.log('\n✅ Ingestion complete.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base documents (chunked)
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,
  embedding   VECTOR(1536),          -- text-embedding-3-small dimension
  source      TEXT,                  -- filename / section tag
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Conversation sessions per WhatsApp JID
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jid         TEXT UNIQUE NOT NULL,  -- WhatsApp JID (phone@s.whatsapp.net)
  history     JSONB DEFAULT '[]',    -- [{role, content}] array
  language    TEXT DEFAULT 'en',     -- detected language code
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Similarity search function (called from retriever.ts)
DROP FUNCTION IF EXISTS match_documents(VECTOR(1536), FLOAT, INT);
DROP FUNCTION IF EXISTS match_documents(VECTOR(384), FLOAT, INT);

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.75,
  match_count     INT   DEFAULT 4
)
RETURNS TABLE (
  id       UUID,
  content  TEXT,
  source   TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE AS $$
  SELECT
    id,
    content,
    source,
    1 - (embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

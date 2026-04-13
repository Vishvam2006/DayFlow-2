import 'dotenv/config';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const config = {
  OPENROUTER_API_KEY:   requireEnv('OPENROUTER_API_KEY'),
  OPENROUTER_BASE_URL:  process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  LLM_MODEL:            process.env.LLM_MODEL ?? 'x-ai/grok-2-1212',
  EMBEDDING_MODEL:      process.env.EMBEDDING_MODEL ?? 'openai/text-embedding-3-small',
  SUPABASE_URL:         requireEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  BOT_NAME:             process.env.BOT_NAME ?? 'HRMSBot',
  SHOP_NAME:            process.env.SHOP_NAME ?? 'Acme Corp HRMS',
  MAX_HISTORY_TURNS:    parseInt(process.env.MAX_HISTORY_TURNS ?? '6'),
  TOP_K_CHUNKS:         parseInt(process.env.TOP_K_CHUNKS ?? '4'),
  SIMILARITY_THRESHOLD: parseFloat(process.env.SIMILARITY_THRESHOLD ?? '0.75'),
  PORT:                 parseInt(process.env.PORT ?? '3000'),
  HRMS_API_BASE_URL:    requireEnv('HRMS_API_BASE_URL'),
  HRMS_BOT_SECRET_KEY:  requireEnv('HRMS_BOT_SECRET_KEY'),
  HRMS_API_TIMEOUT_MS:  parseInt(process.env.HRMS_API_TIMEOUT_MS ?? '8000'),
  EMPLOYEE_VERIFY_CACHE_TTL_MS: parseInt(process.env.EMPLOYEE_VERIFY_CACHE_TTL_MS ?? '300000'),
};

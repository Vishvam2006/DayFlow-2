import dotenv from "dotenv";
import connectToDatabase from "../db/db.js";
import { computeAndCacheInsights } from "../services/analyticsInsightsService.js";

dotenv.config();

async function main() {
  const now = new Date();

  connectToDatabase();

  const windowDays = Number(process.env.ANALYTICS_WINDOW_DAYS || 30);
  const baselineDays = Number(process.env.ANALYTICS_BASELINE_DAYS || 90);
  const batchSize = Number(process.env.ANALYTICS_AI_BATCH_SIZE || 10);
  const ttlDays = Number(process.env.ANALYTICS_CACHE_TTL_DAYS || 14);

  const startedAt = Date.now();
  const result = await computeAndCacheInsights({
    now,
    windowDays,
    baselineDays,
    batchSize,
    ttlDays,
  });

  const elapsedMs = Date.now() - startedAt;
  // eslint-disable-next-line no-console
  console.log(
    `✅ Analytics worker finished. Computed: ${result.computed || 0}. Elapsed: ${elapsedMs}ms`
  );
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Analytics worker failed:", err?.message || err);
  process.exit(1);
});


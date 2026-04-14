import 'dotenv/config';
import http from 'http';
import { createWhatsAppClient } from './modules/whatsapp/client.js';
import { runPipeline } from './modules/pipeline/index.js';
import { logger } from './utils/logger.js';
import { config } from './config/index.js';
import type { VerifiedEmployee } from './modules/hrms/employeeVerifier.js';

// Railway requires an HTTP server (health check)
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', bot: config.BOT_NAME }));
  } else {
    res.writeHead(404).end();
  }
});

server.listen(config.PORT, () => logger.info(`Health server on :${config.PORT}`));

async function main() {
  logger.info('Starting HRMSBot...');
  await createWhatsAppClient(async (jid, text, employee: VerifiedEmployee) => {
    try {
      return await runPipeline(jid, text, employee);
    } catch (err: any) {
      logger.error(err, 'Pipeline error');
      console.error('[pipeline] FULL ERROR:', err?.message ?? err);
      return 'Sorry, something went wrong on my end. Please try again in a moment. 🙏';
    }
  });
}

main().catch(err => { logger.error(err); process.exit(1); });

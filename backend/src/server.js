import { app } from './app.js';
import { env } from './config/env.js';
import { closePool } from './config/database.js';
import { productionSessionStore } from './security/mysql-session-store.js';

const server = app.listen(env.API_PORT, env.API_HOST, () => {
  console.info(`Elite Convention Hall API listening at http://${env.API_HOST}:${env.API_PORT}`);
});

const cleanupTimer = setInterval(() => {
  productionSessionStore.purgeExpired().catch(e =>
    console.error('Session maintenance failed:', e?.code ?? e?.name));
}, 15 * 60 * 1000);
cleanupTimer.unref();

async function shutdown(signal) {
  console.info(`Received ${signal}; closing API`);
  clearInterval(cleanupTimer);
  server.close(async (err) => {
    try { await closePool(); }
    catch (closeError) { console.error('Database shutdown error:', closeError?.code); process.exitCode = 1; }
    if (err) { console.error('HTTP shutdown error:', err.message); process.exitCode = 1; }
    process.exit();
  });
}
process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
process.once('SIGINT', () => { void shutdown('SIGINT'); });

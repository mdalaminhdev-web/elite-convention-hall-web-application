import { closePool, getPool } from '../src/config/database.js';

try {
  const pool = getPool();
  const [versions] = await pool.query('SELECT `version` FROM `schema_migrations` ORDER BY `version`');
  const [settings] = await pool.query('SELECT `display_mode` FROM `inquiry_count_settings` WHERE `id` = 1');
  const [tableCount] = await pool.query(`
    SELECT COUNT(*) AS n FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
  `);
  const found = new Set(versions.map((v) => v.version));
  const required = Array.from({ length: 11 }, (_, n) => String(n).padStart(3, '0'));
  const missing = required.filter((v) => !found.has(v));
  const total = Number(tableCount[0]?.n ?? 0);
  console.log('Schema:', { tables: total, migrations: versions.length, mode: settings[0]?.display_mode ?? 'MISSING' });
  if (total !== 26 || missing.length || settings.length !== 1) {
    throw new Error(`Unexpected Phase 3 schema: table count ${total}/26; missing migrations: ${missing.join(', ') || 'none'}; count-mode rows: ${settings.length}`);
  }
  console.log('PASS: Phase 3 baseline tables and initial count configuration detected.');
  console.log('NOTE: this does not replace the supplied verify_installation.sql or end-to-end tests.');
} catch (error) {
  console.error('FAIL: MySQL connection/schema check:', error?.message);
  process.exitCode = 1;
} finally {
  await closePool();
}

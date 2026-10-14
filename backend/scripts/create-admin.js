import readline from 'node:readline/promises';
import { Writable } from 'node:stream';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getPool, closePool } from '../src/config/database.js';

// Security: this script requires an interactive terminal. The password is not an argument or written to a log.
async function getText(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(prompt)).trim(); }
  finally { rl.close(); }
}
async function getPassword() {
  process.stdout.write('Admin password (hidden): ');
  const hiddenOutput = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const rl = readline.createInterface({ input: process.stdin, output: hiddenOutput, terminal: true });
  try { return await rl.question(''); }
  finally { rl.close(); process.stdout.write('\n'); }
}

if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('Run admin:create interactively in your terminal; do not pipe passwords or pass them as arguments.');
  process.exitCode = 1;
} else {
  let pass;
  try {
    const name = await getText('Full name: ');
    const email = (await getText('Admin email: ')).toLowerCase();
    pass = await getPassword();
    const valid = z.object({
      name: z.string().min(2).max(150),
      email: z.email().max(254),
      pass: z.string().min(12).max(72),
    }).safeParse({ name, email, pass });
    if (!valid.success || Buffer.byteLength(pass, 'utf8') > 72) {
      throw new Error('Invalid details: name 2–150 chars, valid email, password 12–72 UTF-8 bytes.');
    }
    const passwordHash = await bcrypt.hash(pass, 12);
    pass = undefined;
    await getPool().execute(
      'INSERT INTO admin_users (full_name, email, password_hash, is_active) VALUES (?, ?, ?, 1)',
      [name, email, passwordHash],
    );
    console.info('Admin account created. No default passwords or public sign-up were enabled.');
  } catch (error) {
    console.error(error?.code === 'ER_DUP_ENTRY' ? 'An admin account with this email already exists.' : error.message);
    process.exitCode = 1;
  } finally { pass = undefined; await closePool(); }
}

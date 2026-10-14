import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().min(1).default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  TRUST_PROXY: z.coerce.number().int().min(0).max(1).default(0),
  DB_HOST: z.string().min(1).default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: z.string().min(1).default('elite_convention_hall'),
  DB_USER: z.string().min(1).default('elite_app'),
  DB_PASSWORD: z.string().default(''),
  DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(20).default(5),
  SESSION_SECRET: z.string().default(''),
  ADMIN_ALLOWED_ORIGINS: z.string().default('http://127.0.0.1:5174'),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`);
}
export const env = parsed.data;
const insecureExample = /REPLACE|CHANGE_ME|EXAMPLE|YOUR_SECRET/i;
if (env.NODE_ENV === 'production') {
  if (env.SESSION_SECRET.length < 32 || insecureExample.test(env.SESSION_SECRET)) {
    throw new Error('Production requires a strong, non-placeholder SESSION_SECRET of at least 32 characters');
  }
  if (!env.DB_PASSWORD || insecureExample.test(env.DB_PASSWORD)) {
    throw new Error('Production requires a configured database password');
  }
  if (!env.ADMIN_ALLOWED_ORIGINS.split(',').every(v => v.trim().startsWith('https://'))) {
    throw new Error('Production ADMIN_ALLOWED_ORIGINS must use HTTPS');
  }
}
// Ephemeral key is permitted ONLY for local development/tests. Sessions reset when the backend restarts.
export const sessionSecret = env.SESSION_SECRET.length >= 32 && !insecureExample.test(env.SESSION_SECRET)
  ? env.SESSION_SECRET
  : randomBytes(48).toString('hex');
if (!env.SESSION_SECRET && env.NODE_ENV === 'development') {
  console.warn('SESSION_SECRET not configured: using a temporary development-only secret');
}
export const allowedAdminOrigins = env.ADMIN_ALLOWED_ORIGINS
  .split(',').map(v => v.trim()).filter(Boolean);

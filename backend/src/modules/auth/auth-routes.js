import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_PATH, csrfToken, requireAdmin, requireCsrf } from '../../security/admin-security.js';
import { env } from '../../config/env.js';

const credentialsSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
}).strict();
const INVALID_CREDENTIALS = { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } };
const dummyHash = bcrypt.hashSync('a-constant-dummy-admin-login-password', 12);

const regenerateSession = (req) => new Promise((resolve, reject) => req.session.regenerate(e => e ? reject(e) : resolve()));
const saveSession = (req) => new Promise((resolve, reject) => req.session.save(e => e ? reject(e) : resolve()));
const destroySession = (req) => new Promise((resolve, reject) => req.session.destroy(e => e ? reject(e) : resolve()));

export function authRoutes(repository) {
  const router = Router();
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 6,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_req, res) => res.status(429).json({ error: { code: 'LOGIN_RATE_LIMIT', message: 'Too many login attempts. Try again later.' } }),
  });

  router.get('/csrf', (req, res) => res.status(200).json({ csrfToken: csrfToken(req) }));

  router.post('/login', loginLimit, requireCsrf, async (req, res, next) => {
    try {
      const parsed = credentialsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A valid email and password are required' } });
      }
      // bcrypt has a 72-byte input boundary; never accept distinct overlong inputs as equivalent.
      if (Buffer.byteLength(parsed.data.password, 'utf8') > 72) return res.status(401).json(INVALID_CREDENTIALS);
      const email = parsed.data.email.trim().toLowerCase();
      const user = await repository.findByEmail(email);
      const matched = await bcrypt.compare(parsed.data.password, user?.password_hash ?? dummyHash);
      if (!user || !user.is_active || !matched) return res.status(401).json(INVALID_CREDENTIALS);

      // Rotate the session ID after privilege elevation to prevent session fixation.
      await regenerateSession(req);
      req.session.adminId = String(user.id);
      const nextCsrf = csrfToken(req);
      await repository.recordSuccessfulLogin(user.id);
      await saveSession(req);
      return res.status(200).json({
        admin: { id: user.id, fullName: user.full_name, email: user.email },
        csrfToken: nextCsrf,
      });
    } catch (error) { next(error); }
  });

  router.get('/me', requireAdmin(repository), (req, res) => res.status(200).json({ admin: req.admin }));

  router.post('/logout', requireCsrf, async (req, res, next) => {
    try {
      await destroySession(req);
      res.clearCookie(ADMIN_COOKIE_NAME, {
        path: ADMIN_COOKIE_PATH,
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
      });
      res.status(204).end();
    } catch (error) { next(error); }
  });
  return router;
}

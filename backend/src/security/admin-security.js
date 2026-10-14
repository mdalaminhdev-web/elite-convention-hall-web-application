import { randomBytes, timingSafeEqual } from 'node:crypto';
import session from 'express-session';
import { allowedAdminOrigins, env, sessionSecret } from '../config/env.js';

export const ADMIN_COOKIE_NAME = 'elite_admin_sid';
export const ADMIN_COOKIE_PATH = '/api/v1/admin';

export function adminSessionMiddleware(store) {
  return session({
    name: ADMIN_COOKIE_NAME,
    secret: sessionSecret,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    cookie: {
      path: ADMIN_COOKIE_PATH,
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    },
  });
}

export function setNoStore(_req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Cookie');
  next();
}

export function guardAdminOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('sec-fetch-site') === 'cross-site') {
    return res.status(403).json({ error: { code: 'CROSS_SITE_DENIED', message: 'Request origin not permitted' } });
  }
  const origin = req.get('origin');
  if (origin && !allowedAdminOrigins.includes(origin)) {
    return res.status(403).json({ error: { code: 'ORIGIN_DENIED', message: 'Request origin not permitted' } });
  }
  return next();
}

export function csrfToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = randomBytes(32).toString('hex');
  return req.session.csrfToken;
}

export function requireCsrf(req, res, next) {
  const expected = req.session?.csrfToken;
  const actual = req.get('x-csrf-token');
  if (!expected || !actual || actual.length !== expected.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    return res.status(403).json({ error: { code: 'CSRF_DENIED', message: 'Invalid or missing CSRF token' } });
  }
  next();
}

export function requireAdmin(repository) {
  return async (req, res, next) => {
    try {
      if (!req.session?.adminId) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Administrator authentication required' } });
      }
      const user = await repository.findById(req.session.adminId);
      if (!user || !user.is_active) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Administrator authentication required' } });
      }
      req.admin = { id: user.id, fullName: user.full_name, email: user.email };
      next();
    } catch (error) { next(error); }
  };
}

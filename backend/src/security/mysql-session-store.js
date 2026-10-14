import session from 'express-session';
import { createHash } from 'node:crypto';
import { getPool } from '../config/database.js';

// Matches the approved Phase 3 admin_sessions(session_id, expires, data) table.
// Database keys are SHA-256 digests of cookie session IDs, never raw bearer IDs.
export class MySqlSessionStore extends session.Store {
  constructor({ pool = getPool, ttlSeconds = 8 * 60 * 60 } = {}) {
    super();
    this.pool = pool;
    this.ttlSeconds = ttlSeconds;
  }

  sessionKey(sessionId) {
    return createHash('sha256').update(sessionId).digest('hex');
  }

  expiresAt(sess) {
    const expiry = sess.cookie?.expires ? new Date(sess.cookie.expires).getTime() : Date.now() + this.ttlSeconds * 1000;
    return Math.floor(expiry / 1000);
  }

  get(sid, callback) {
    this.pool().execute(
      'SELECT data FROM admin_sessions WHERE session_id = ? AND expires > UNIX_TIMESTAMP() LIMIT 1',
      [this.sessionKey(sid)],
    ).then(([rows]) => callback(null, rows.length ? JSON.parse(rows[0].data) : null)).catch(callback);
  }

  set(sid, sess, callback = () => {}) {
    const key = this.sessionKey(sid);
    const expires = this.expiresAt(sess);
    const data = JSON.stringify(sess);
    this.pool().execute(
      'INSERT INTO admin_sessions (session_id, expires, data) VALUES (?, ?, ?) ' +
      'ON DUPLICATE KEY UPDATE expires = VALUES(expires), data = VALUES(data)',
      [key, expires, data],
    ).then(() => callback(null)).catch(callback);
  }

  destroy(sid, callback = () => {}) {
    this.pool().execute('DELETE FROM admin_sessions WHERE session_id = ?', [this.sessionKey(sid)])
      .then(() => callback(null)).catch(callback);
  }

  touch(sid, sess, callback = () => {}) {
    this.pool().execute('UPDATE admin_sessions SET expires = ? WHERE session_id = ?',
      [this.expiresAt(sess), this.sessionKey(sid)],
    ).then(() => callback(null)).catch(callback);
  }

  async purgeExpired(limit = 1000) {
    const bounded = Math.max(1, Math.min(1000, Math.floor(limit)));
    const [result] = await this.pool().query(`DELETE FROM admin_sessions WHERE expires <= UNIX_TIMESTAMP() LIMIT ${bounded}`);
    return result.affectedRows;
  }
}
export const productionSessionStore = new MySqlSessionStore();

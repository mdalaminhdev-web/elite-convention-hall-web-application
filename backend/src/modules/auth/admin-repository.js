import { getPool } from '../../config/database.js';

export const adminRepository = {
  async findByEmail(email) {
    const [rows] = await getPool().execute(
      'SELECT id, full_name, email, password_hash, is_active FROM admin_users WHERE email = ? LIMIT 1',
      [email],
    );
    return rows[0] ?? null;
  },
  async findById(id) {
    const [rows] = await getPool().execute(
      'SELECT id, full_name, email, is_active FROM admin_users WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ?? null;
  },
  async recordSuccessfulLogin(id) {
    const pool = getPool();
    // Critical security activity is written to the Phase 3 audit table. No password data is logged.
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('UPDATE admin_users SET last_login_at = UTC_TIMESTAMP(3) WHERE id = ?', [id]);
      await connection.execute(
        'INSERT INTO admin_audit_logs (admin_user_id, action, entity_type, entity_key) VALUES (?, ?, ?, ?)',
        [id, 'AUTH_LOGIN', 'admin_user', String(id)],
      );
      await connection.commit();
    } catch (error) {
      try { await connection.rollback(); } catch { /* original error is more useful */ }
      throw error;
    } finally { connection.release(); }
  },
};

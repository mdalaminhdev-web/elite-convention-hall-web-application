import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';

const password = 'correct-secure-test-password';
const hash = await bcrypt.hash(password, 4); // fast hash only for fixture; production provisioning uses cost 12.
const active = { id: 8, full_name: 'Website Admin', email: 'admin@example.test', password_hash: hash, is_active: 1 };
const disabled = { ...active, is_active: 0 };
function fixture({ user = active } = {}) {
  const calls = [];
  const repository = {
    async findByEmail(email) { return email === 'admin@example.test' ? user : null; },
    async findById(id) { return String(id) === String(active.id) ? user : null; },
    async recordSuccessfulLogin(id) { calls.push(id); },
  };
  const app = createApp({ sessionStore: new session.MemoryStore(), repository });
  return { app, calls };
}
async function csrf(agent) {
  const response = await agent.get('/api/v1/admin/auth/csrf').expect(200);
  assert.equal(response.body.csrfToken.length, 64);
  return response.body.csrfToken;
}

test('anonymous users cannot access /me or /ping', async () => {
  const { app } = fixture();
  const a = await request(app).get('/api/v1/admin/auth/me');
  const b = await request(app).get('/api/v1/admin/ping');
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.match(a.headers['cache-control'], /no-store/);
});

test('CSRF protection blocks login without a token or with wrong token', async () => {
  const { app } = fixture();
  const agent = request.agent(app);
  await csrf(agent);
  await agent.post('/api/v1/admin/auth/login').send({ email: active.email, password }).expect(403);
  await agent.post('/api/v1/admin/auth/login').set('x-csrf-token', 'z'.repeat(64)).send({ email: active.email, password }).expect(403);
});

test('login, authenticated access, and logout complete a secure session lifecycle', async () => {
  const { app, calls } = fixture();
  const agent = request.agent(app);
  const token = await csrf(agent);
  await agent.post('/api/v1/admin/auth/login').set('x-csrf-token', token)
    .send({ email: active.email, password: 'invalid-pass' }).expect(401);
  const response = await agent.post('/api/v1/admin/auth/login').set('x-csrf-token', token)
    .send({ email: active.email, password }).expect(200);
  assert.equal(response.body.admin.email, active.email);
  assert.equal(typeof response.body.csrfToken, 'string');
  assert.equal(response.body.admin.password_hash, undefined);
  assert.equal(calls.length, 1);
  const header = response.headers['set-cookie']?.join(' ') ?? '';
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Lax/i);
  await agent.get('/api/v1/admin/auth/me').expect(200);
  await agent.get('/api/v1/admin/ping').expect(200);
  await agent.post('/api/v1/admin/auth/logout').set('x-csrf-token', token).expect(403);
  await agent.post('/api/v1/admin/auth/logout').set('x-csrf-token', response.body.csrfToken).expect(204);
  await agent.get('/api/v1/admin/auth/me').expect(401);
});

test('disabled users and unknown accounts are rejected without account discovery', async () => {
  for (const user of [disabled, null]) {
    const { app } = fixture({ user });
    const agent = request.agent(app);
    const token = await csrf(agent);
    const response = await agent.post('/api/v1/admin/auth/login').set('x-csrf-token', token)
      .send({ email: active.email, password }).expect(401);
    assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
  }
});

test('invalid body rejected; unauthorized origin denied', async () => {
  const { app } = fixture();
  const agent = request.agent(app);
  const token = await csrf(agent);
  const a = await agent.post('/api/v1/admin/auth/login').set('x-csrf-token', token)
    .send({ email: 'invalid', password }).expect(400);
  assert.equal(a.body.error.code, 'VALIDATION_ERROR');
  const b = await agent.post('/api/v1/admin/auth/login').set('origin', 'https://evil.example').set('x-csrf-token', token)
    .send({ email: active.email, password }).expect(403);
  assert.equal(b.body.error.code, 'ORIGIN_DENIED');
});

test('admin session MySQL store hashes session IDs (not raw cookie tokens)', async () => {
  const { MySqlSessionStore } = await import('../src/security/mysql-session-store.js');
  const fake = { execute: async () => [[]] };
  const store = new MySqlSessionStore({ pool: () => fake });
  assert.equal(store.sessionKey('raw-session-id').length, 64);
  assert.notEqual(store.sessionKey('raw-session-id'), 'raw-session-id');
});

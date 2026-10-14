import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('health endpoint returns an actual API response', async () => {
  const response = await request(app).get('/api/v1/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
  assert.match(response.headers['cache-control'], /no-store/);
});

test('undefined API endpoints return JSON 404', async () => {
  const response = await request(app).get('/api/v1/not-a-real-endpoint');
  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'NOT_FOUND');
});

test('invalid JSON is rejected without exposing a stack trace', async () => {
  const response = await request(app).post('/api/v1/health').set('Content-Type', 'application/json').send('{broken');
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'BAD_JSON');
  assert.equal(JSON.stringify(response.body).includes('stack'), false);
});

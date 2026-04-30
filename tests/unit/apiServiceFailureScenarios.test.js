import assert from 'node:assert/strict';
import test from 'node:test';
import nock from 'nock';

import APIService, { APIServiceError } from '../../services/apiService.js';

test('APIService retries transient failure and succeeds', async () => {
  const baseUrl = 'http://127.0.0.1';
  let callCount = 0;

  nock(baseUrl)
    .get('/transient')
    .times(2)
    .reply(() => {
      callCount += 1;
      return [503, { error: 'temporary failure' }];
    });

  nock(baseUrl)
    .get('/transient')
    .reply(200, { ok: true });

  const api = new APIService({
    baseUrl,
    retryAttempts: 2,
    timeout: 2000,
  });

  const result = await api.get('/transient');
  assert.equal(result.ok, true);
  assert.equal(callCount, 2);
});

test('APIService handles auth + pagination and detects partial fields', async () => {
  const baseUrl = 'http://127.0.0.1';

  nock(baseUrl)
    .get('/users')
    .query({ page: 1 })
    .matchHeader('authorization', 'Bearer test-token')
    .reply(200, {
      page: 1,
      hasNextPage: true,
      data: [{ id: 1, email: 'user1@example.com' }],
    });

  nock(baseUrl)
    .get('/users')
    .query({ page: 2 })
    .matchHeader('authorization', 'Bearer test-token')
    .reply(200, {
      page: 2,
      hasNextPage: false,
      data: [{ id: 2 }],
    });

  const api = new APIService({ baseUrl, retryAttempts: 1, timeout: 2000 });

  const pageOne = await api.get('/users', {
    params: { page: 1 },
    headers: { Authorization: 'Bearer test-token' },
  });
  const pageTwo = await api.get('/users', {
    params: { page: 2 },
    headers: { Authorization: 'Bearer test-token' },
  });

  assert.equal(pageOne.hasNextPage, true);
  assert.equal(pageTwo.hasNextPage, false);
  assert.equal('email' in pageTwo.data[0], false);
});

test('APIService surfaces API error after retries exhausted', async () => {
  const baseUrl = 'http://127.0.0.1';
  nock(baseUrl).get('/always-fail').times(3).reply(500, { error: 'boom' });

  const api = new APIService({
    baseUrl,
    retryAttempts: 2,
    timeout: 2000,
  });

  await assert.rejects(
    () => api.get('/always-fail'),
    (error) => error instanceof APIServiceError && error.statusCode === 500
  );
});


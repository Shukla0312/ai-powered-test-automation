import assert from 'node:assert/strict';
import test from 'node:test';

import APIService, { APIServiceError } from '../../services/apiService.js';

function createServiceWithStub(stubFn, options = {}) {
  const service = new APIService({
    baseUrl: 'https://example.test',
    timeout: 2000,
    retryAttempts: options.retryAttempts ?? 2,
  });

  service.axiosInstance = stubFn;
  service._sleep = async () => {};
  return service;
}

test('APIService retries retryable errors and succeeds', async () => {
  let attempts = 0;
  const service = createServiceWithStub(async () => {
    attempts += 1;
    if (attempts < 3) {
      const error = new Error('Too Many Requests');
      error.response = { status: 429, data: { message: 'rate limited' } };
      throw error;
    }
    return { status: 200, data: { ok: true } };
  });

  const response = await service.get('/health');
  assert.equal(response.ok, true);
  assert.equal(attempts, 3);
  assert.equal(service.getRequestHistory().length, 3);
});

test('APIService does not retry non-retryable 4xx errors', async () => {
  let attempts = 0;
  const service = createServiceWithStub(async () => {
    attempts += 1;
    const error = new Error('Bad Request');
    error.response = { status: 400, data: { message: 'invalid input' } };
    throw error;
  }, { retryAttempts: 3 });

  await assert.rejects(
    () => service.get('/users'),
    (error) =>
      error instanceof APIServiceError &&
      error.statusCode === 400 &&
      error.message.includes('GET /users failed')
  );
  assert.equal(attempts, 1);
});

test('APIService logs expected negative responses as expected failures', async () => {
  const service = createServiceWithStub(async () => {
    const error = new Error('Not Found');
    error.response = { status: 404, data: { message: 'not found' } };
    throw error;
  }, { retryAttempts: 0 });

  await assert.rejects(() => service.get('/unknown', { expectedStatus: 404 }), APIServiceError);

  const history = service.getRequestHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].expectedFailure, true);
  assert.equal(history[0].statusCode, 404);
});

test('APIService throws after retry exhaustion on retryable errors', async () => {
  let attempts = 0;
  const service = createServiceWithStub(async () => {
    attempts += 1;
    const error = new Error('Service Unavailable');
    error.response = { status: 503, data: { message: 'temporarily unavailable' } };
    throw error;
  }, { retryAttempts: 2 });

  await assert.rejects(
    () => service.get('/degraded'),
    (error) =>
      error instanceof APIServiceError &&
      error.statusCode === 503 &&
      error.message.includes('GET /degraded failed')
  );

  assert.equal(attempts, 3);
});

test('APIService retries timeout errors and surfaces timeout metadata', async () => {
  let attempts = 0;
  const service = createServiceWithStub(async () => {
    attempts += 1;
    const error = new Error('timeout exceeded');
    error.code = 'ECONNABORTED';
    throw error;
  }, { retryAttempts: 1 });

  await assert.rejects(
    () => service.get('/slow-endpoint'),
    (error) =>
      error instanceof APIServiceError &&
      error.statusCode === null &&
      error.message.includes('timeout exceeded')
  );

  assert.equal(attempts, 2);
  const history = service.getRequestHistory();
  assert.equal(history.every((item) => item.expectedFailure === false), true);
});

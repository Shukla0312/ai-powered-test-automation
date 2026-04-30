import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';

import APIService from '../../services/apiService.js';
import { createSchemaDecision } from '../../utils/aiDecisionEngine.js';

const scenarioId = 'ENT-MED-001';
const selectedScenarioIds = new Set(
  (process.env.SCENARIO_IDS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
);

function startMockEnterpriseApi() {
  let ordersFailureCount = 0;

  const server = http.createServer((req, res) => {
    const auth = req.headers.authorization;
    const version = req.headers['x-api-version'];

    if (auth !== 'Bearer integration-token') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }

    if (version !== 'v1') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'missing or invalid api version' }));
      return;
    }

    if (req.url.startsWith('/v1/customers?page=')) {
      const pageParam = Number(new URL(req.url, 'http://localhost').searchParams.get('page'));
      const payload = pageParam === 1
        ? {
            page: 1,
            hasNextPage: true,
            data: [{ id: 'cus_001', email: 'customer1@example.com', status: 'active' }],
          }
        : {
            page: 2,
            hasNextPage: false,
            data: [{ id: 'cus_002', email: 'customer2@example.com', status: 'active' }],
          };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.url === '/v1/orders/partial-failure') {
      ordersFailureCount += 1;
      if (ordersFailureCount === 1) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'upstream dependency unavailable' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'ord_100', state: 'confirmed', recovery: true }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  });

  return new Promise((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

test('integration: validates auth, versioning, pagination, and partial failure recovery', async () => {
  if (selectedScenarioIds.size > 0 && !selectedScenarioIds.has(scenarioId)) {
    return;
  }

  const { server, baseUrl } = await startMockEnterpriseApi();
  const api = new APIService({
    baseUrl,
    timeout: 2000,
    retryAttempts: 1,
  });

  try {
    const headers = {
      Authorization: 'Bearer integration-token',
      'X-API-Version': 'v1',
    };

    const pageOne = await api.get('/v1/customers', { params: { page: 1 }, headers });
    const pageTwo = await api.get('/v1/customers', { params: { page: 2 }, headers });
    const recoveredOrder = await api.get('/v1/orders/partial-failure', { headers });

    const pageSchema = { required: ['page', 'hasNextPage', 'data'] };
    const orderSchema = { required: ['id', 'state', 'recovery'] };

    const pageOneDecision = createSchemaDecision(pageOne, pageSchema.required);
    const pageTwoDecision = createSchemaDecision(pageTwo, pageSchema.required);
    const orderDecision = createSchemaDecision(recoveredOrder, orderSchema.required);

    assert.equal(pageOneDecision.isValid, true);
    assert.equal(pageTwoDecision.isValid, true);
    assert.equal(orderDecision.isValid, true);
    assert.equal(pageOne.hasNextPage, true);
    assert.equal(pageTwo.hasNextPage, false);
    assert.equal(recoveredOrder.recovery, true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

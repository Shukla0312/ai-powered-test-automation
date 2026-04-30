import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';

import APIService from '../../services/apiService.js';
import { createSchemaDecision } from '../../utils/aiDecisionEngine.js';

const checkoutPaymentsScenarioPack = [
  {
    id: 'PAY-CRIT-001',
    risk: 'critical',
    name: 'Authorized payment must create settled order',
    endpoint: '/v1/checkout/authorize-and-capture',
    expectedStatus: 200,
    required: ['payment.status', 'payment.amount', 'order.id', 'order.state', 'currency'],
    invariant: (response) =>
      response.payment.status === 'captured' &&
      response.order.state === 'placed' &&
      response.payment.amount === response.order.totalAmount,
  },
  {
    id: 'PAY-HIGH-002',
    risk: 'high',
    name: 'Insufficient funds must not place order',
    endpoint: '/v1/checkout/insufficient-funds',
    expectedStatus: 402,
    required: ['error.code', 'error.message', 'order.state'],
    invariant: (response) =>
      response.error.code === 'INSUFFICIENT_FUNDS' && response.order.state === 'payment_failed',
  },
  {
    id: 'PAY-MED-003',
    risk: 'medium',
    name: 'Idempotent retry keeps single order identity',
    endpoint: '/v1/checkout/idempotent-retry',
    expectedStatus: 200,
    required: ['order.id', 'order.state', 'idempotency.reused'],
    invariant: (response) =>
      response.order.state === 'placed' && response.idempotency.reused === true,
  },
];

function startCheckoutPaymentsApi() {
  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid request' }));
      return;
    }

    if (req.url === '/v1/checkout/authorize-and-capture') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          currency: 'USD',
          payment: { status: 'captured', amount: 129.99 },
          order: { id: 'ord_901', state: 'placed', totalAmount: 129.99 },
        })
      );
      return;
    }

    if (req.url === '/v1/checkout/insufficient-funds') {
      res.writeHead(402, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: { code: 'INSUFFICIENT_FUNDS', message: 'Payment authorization declined' },
          order: { state: 'payment_failed' },
        })
      );
      return;
    }

    if (req.url === '/v1/checkout/idempotent-retry') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          order: { id: 'ord_901', state: 'placed' },
          idempotency: { reused: true, key: 'checkout-abc-123' },
        })
      );
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  });

  return new Promise((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

test('integration: checkout/payments scenario pack enforces risk-based invariants', async () => {
  const { server, baseUrl } = await startCheckoutPaymentsApi();
  const api = new APIService({
    baseUrl,
    timeout: 2000,
    retryAttempts: 1,
  });

  try {
    for (const scenario of checkoutPaymentsScenarioPack) {
      try {
        const response = await api.get(scenario.endpoint);
        assert.equal(scenario.expectedStatus, 200, `${scenario.id} expected non-200 status`);

        const schemaDecision = createSchemaDecision(response, scenario.required);
        assert.equal(schemaDecision.isValid, true, `${scenario.id} schema gate failed`);
        assert.equal(scenario.invariant(response), true, `${scenario.id} invariant failed`);
      } catch (error) {
        if (scenario.expectedStatus >= 400) {
          assert.equal(error.statusCode, scenario.expectedStatus, `${scenario.id} wrong status code`);
          const schemaDecision = createSchemaDecision(error.response, scenario.required);
          assert.equal(schemaDecision.isValid, true, `${scenario.id} schema gate failed`);
          assert.equal(scenario.invariant(error.response), true, `${scenario.id} invariant failed`);
          continue;
        }
        throw error;
      }
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

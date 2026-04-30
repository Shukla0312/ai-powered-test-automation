import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMockDecision,
  createSchemaDecision,
  interpretAIResponse,
} from '../../utils/aiDecisionEngine.js';

test('interpretAIResponse returns PASS for valid structured AI output', () => {
  const decision = interpretAIResponse(
    {
      isValid: true,
      validationScore: 91,
      reason: 'Response satisfies the business rule',
    },
    { minScore: 80 }
  );

  assert.equal(decision.status, 'PASS');
  assert.equal(decision.isValid, true);
  assert.equal(decision.reason, 'Response satisfies the business rule');
  assert.equal(decision.confidence, 0.91);
});

test('interpretAIResponse returns FAIL when score is below threshold', () => {
  const decision = interpretAIResponse(
    {
      isValid: true,
      validationScore: 70,
      issues: ['Insufficient confidence'],
    },
    { minScore: 80 }
  );

  assert.equal(decision.status, 'FAIL');
  assert.equal(decision.isValid, false);
  assert.equal(decision.reason, 'Insufficient confidence');
  assert.equal(decision.confidence, 0.7);
});

test('createSchemaDecision rejects missing required fields', () => {
  const decision = createSchemaDecision(
    {
      id: 1,
      name: 'Leanne Graham',
    },
    ['id', 'name', 'email'],
    { minScore: 80 }
  );

  assert.equal(decision.status, 'FAIL');
  assert.equal(decision.isValid, false);
  assert.deepEqual(decision.issues, ['Missing required field: email']);
});

test('createMockDecision supports nested required field paths', () => {
  const decision = createMockDecision(
    {
      id: 1,
      company: {
        name: 'Romaguera-Crona',
      },
    },
    'User should include company information',
    {
      minScore: 80,
      requiredFields: ['id', 'company.name'],
    }
  );

  assert.equal(decision.status, 'PASS');
  assert.equal(decision.isValid, true);
});

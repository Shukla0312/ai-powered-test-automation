import assert from 'node:assert/strict';
import test from 'node:test';

import SemanticValidator, { AIError } from '../../utils/aiValidator.js';

test('SemanticValidator fails safely on malformed AI response', async () => {
  const validator = new SemanticValidator({
    minValidationScore: 80,
    useMockAI: false,
    client: {
      async getCompletion() {
        return '{not-valid-json';
      },
    },
  });

  await assert.rejects(
    () =>
      validator.validateResponse(
        { id: 1, email: 'user@example.com' },
        'Response should be valid',
        { minScore: 80, testName: 'Malformed AI JSON' }
      ),
    (error) =>
      error instanceof AIError &&
      error.validationResult?.reason === 'Invalid AI response format'
  );
});

test('SemanticValidator rejects missing required fields before AI call', async () => {
  let called = false;
  const validator = new SemanticValidator({
    minValidationScore: 80,
    useMockAI: false,
    client: {
      async getCompletion() {
        called = true;
        return '{"isValid":true,"validationScore":99}';
      },
    },
  });

  await assert.rejects(
    () =>
      validator.validateResponse(
        { id: 1, name: 'User' },
        'Must include email',
        {
          schema: { required: ['id', 'name', 'email'] },
          minScore: 80,
          testName: 'Schema edge-case',
        }
      ),
    AIError
  );

  assert.equal(called, false);
});


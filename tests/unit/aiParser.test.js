import assert from 'node:assert/strict';
import test from 'node:test';

import { parseAIResponse } from '../../utils/aiParser.js';

test('parseAIResponse parses valid JSON strings', () => {
  const { parsed, isFallback } = parseAIResponse('{"isValid":true,"validationScore":90}');
  assert.equal(isFallback, false);
  assert.equal(parsed.isValid, true);
  assert.equal(parsed.validationScore, 90);
});

test('parseAIResponse returns fallback for malformed JSON', () => {
  const { parsed, isFallback } = parseAIResponse('{invalid-json');
  assert.equal(isFallback, true);
  assert.equal(parsed.status, 'FAIL');
  assert.equal(parsed.reason, 'Invalid AI response format');
});


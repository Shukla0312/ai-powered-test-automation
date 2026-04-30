import assert from 'node:assert/strict';
import test from 'node:test';

import { parseJSONFromText } from '../../utils/jsonResponseParser.js';

test('parseJSONFromText parses plain JSON payload', () => {
  const parsed = parseJSONFromText('{"isValid":true,"validationScore":91}');
  assert.equal(parsed.isValid, true);
  assert.equal(parsed.validationScore, 91);
});

test('parseJSONFromText parses markdown fenced JSON', () => {
  const parsed = parseJSONFromText('```json\n{"isValid":false,"issues":["missing email"]}\n```');
  assert.equal(parsed.isValid, false);
  assert.deepEqual(parsed.issues, ['missing email']);
});

test('parseJSONFromText extracts JSON wrapped with explanation text', () => {
  const parsed = parseJSONFromText(
    'Validation result below:\n{"isValid":true,"validationScore":88,"reason":"Looks good"}\nDone.'
  );
  assert.equal(parsed.isValid, true);
  assert.equal(parsed.validationScore, 88);
  assert.equal(parsed.reason, 'Looks good');
});

test('parseJSONFromText throws on invalid payload without JSON object', () => {
  assert.throws(
    () => parseJSONFromText('Model failed to return JSON'),
    /No valid JSON payload found/
  );
});

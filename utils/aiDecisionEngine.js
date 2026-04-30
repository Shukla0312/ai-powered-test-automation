/**
 * AI Decision Engine
 * Converts raw AI output into a deterministic validation contract.
 */

function buildReason(aiResult, status, score) {
  if (typeof aiResult === 'string') {
    return aiResult.trim() || `AI returned ${status}`;
  }

  if (typeof aiResult.reason === 'string' && aiResult.reason.trim()) {
    return aiResult.reason.trim();
  }

  if (typeof aiResult.reasoning === 'string' && aiResult.reasoning.trim()) {
    return aiResult.reasoning.trim();
  }

  if (Array.isArray(aiResult.issues) && aiResult.issues.length > 0) {
    return aiResult.issues.join('; ');
  }

  return status === 'PASS'
    ? `Response is logically valid with score ${score}/100`
    : `Response did not meet the minimum validation score of ${score}/100`;
}

function hasPath(value, path) {
  return path
    .split('.')
    .every((segment) => {
      if (!value || typeof value !== 'object' || !(segment in value)) {
        return false;
      }
      value = value[segment];
      return value !== undefined && value !== null && value !== '';
    });
}

export function interpretAIResponse(aiResult, options = {}) {
  const minScore = options.minScore ?? 75;

  if (typeof aiResult === 'string') {
    const normalized = aiResult.toUpperCase();
    const passed = normalized.includes('PASS') && !normalized.includes('FAIL');
    const status = passed ? 'PASS' : 'FAIL';

    return {
      status,
      isValid: passed,
      validationScore: passed ? 100 : 0,
      reason: buildReason(aiResult, status, passed ? 100 : 0),
      issues: passed ? [] : ['AI response did not contain a clear PASS decision'],
      suggestions: [],
    };
  }

  const validationScore = Number(aiResult.validationScore ?? aiResult.score ?? 0);
  const aiMarkedValid = Boolean(aiResult.isValid ?? aiResult.pass ?? false);
  const passed = aiMarkedValid && validationScore >= minScore;
  const status = passed ? 'PASS' : 'FAIL';

  return {
    ...aiResult,
    status,
    isValid: passed,
    validationScore,
    reason: buildReason(aiResult, status, validationScore),
    issues: Array.isArray(aiResult.issues) ? aiResult.issues : [],
    suggestions: Array.isArray(aiResult.suggestions) ? aiResult.suggestions : [],
  };
}

export function createMockDecision(response, expectedBehavior, options = {}) {
  const minScore = options.minScore ?? 75;
  const hasObjectResponse = response && typeof response === 'object';
  const hasExpectedBehavior =
    typeof expectedBehavior === 'string' && expectedBehavior.trim().length > 0;
  const hasRequiredFields = Array.isArray(options.requiredFields)
    ? options.requiredFields.every((field) => hasPath(response, field))
    : true;

  const score = hasObjectResponse && hasExpectedBehavior && hasRequiredFields
    ? 90
    : 45;

  return interpretAIResponse(
    {
      isValid: score >= minScore,
      validationScore: score,
      reason:
        score >= minScore
          ? 'Mock AI confirmed response satisfies the validation intent'
          : 'Mock AI detected missing response data or required fields',
      issues: score >= minScore ? [] : ['Response or validation intent is incomplete'],
      suggestions: score >= minScore ? [] : ['Provide required fields and clear expected behavior'],
    },
    { minScore }
  );
}

export function createSchemaDecision(response, requiredFields = [], options = {}) {
  const missingFields = requiredFields.filter((field) => !hasPath(response, field));
  const passed = missingFields.length === 0;

  return interpretAIResponse(
    {
      isValid: passed,
      validationScore: passed ? 100 : 0,
      reason: passed
        ? 'Required schema fields are present'
        : `Missing required field(s): ${missingFields.join(', ')}`,
      issues: passed ? [] : missingFields.map((field) => `Missing required field: ${field}`),
      suggestions: passed ? [] : ['Fix the API response contract before semantic validation'],
    },
    {
      minScore: options.minScore ?? 75,
    }
  );
}

/**
 * AI Decision Engine
 * Converts raw AI output into deterministic validation decisions.
 */

export function interpretAIResponse(aiResult, options = {}) {
  const minScore = options.minScore ?? 75;

  if (typeof aiResult === 'string') {
    const normalized = aiResult.toUpperCase();
    return {
      isValid: normalized.includes('PASS') && !normalized.includes('FAIL'),
      validationScore: normalized.includes('PASS') ? 100 : 0,
      issues: normalized.includes('PASS') ? [] : ['AI response did not contain PASS'],
      suggestions: [],
      reasoning: aiResult,
    };
  }

  const validationScore = Number(aiResult.validationScore ?? aiResult.score ?? 0);
  const aiMarkedValid = Boolean(aiResult.isValid ?? aiResult.pass ?? false);

  return {
    ...aiResult,
    validationScore,
    isValid: aiMarkedValid && validationScore >= minScore,
    issues: Array.isArray(aiResult.issues) ? aiResult.issues : [],
    suggestions: Array.isArray(aiResult.suggestions) ? aiResult.suggestions : [],
  };
}

export function createMockDecision(response, expectedBehavior, options = {}) {
  const hasObjectResponse = response && typeof response === 'object';
  const hasExpectedBehavior =
    typeof expectedBehavior === 'string' && expectedBehavior.trim().length > 0;
  const score = hasObjectResponse && hasExpectedBehavior ? 90 : 40;

  return interpretAIResponse(
    {
      isValid: score >= (options.minScore ?? 75),
      validationScore: score,
      issues: score >= 75 ? [] : ['Response or expected behavior is incomplete'],
      suggestions: score >= 75 ? [] : ['Provide a complete response and validation goal'],
    },
    options
  );
}

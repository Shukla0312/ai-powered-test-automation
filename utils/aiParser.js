export function parseAIResponse(rawResponse) {
  const invalidFallback = {
    status: 'FAIL',
    reason: 'Invalid AI response format',
    confidence: 0,
    isValid: false,
    validationScore: 0,
    issues: ['Invalid AI response format'],
    suggestions: ['Ensure provider returns valid JSON contract'],
  };

  if (rawResponse && typeof rawResponse === 'object') {
    return {
      parsed: rawResponse,
      isFallback: false,
      fallback: null,
    };
  }

  if (typeof rawResponse !== 'string' || rawResponse.trim().length === 0) {
    return {
      parsed: invalidFallback,
      isFallback: true,
      fallback: invalidFallback,
    };
  }

  try {
    return {
      parsed: JSON.parse(rawResponse),
      isFallback: false,
      fallback: null,
    };
  } catch {
    return {
      parsed: invalidFallback,
      isFallback: true,
      fallback: invalidFallback,
    };
  }
}


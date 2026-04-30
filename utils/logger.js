export function logAIValidation(decision) {
  const status = decision.status || (decision.isValid ? 'PASS' : 'FAIL');
  const reason = decision.reason || 'No reason provided';

  console.log(
    `[AI VALIDATION] ${status} - ${reason}`
  );
}

export function logStep(message) {
  console.log(`[TEST STEP] ${message}`);
}

export function logSummary(message) {
  console.log(`[SUMMARY] ${message}`);
}

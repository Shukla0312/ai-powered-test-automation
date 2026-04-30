export function logAIValidation(decision) {
  console.log(
    `[AI VALIDATION] ${decision.status} - ${decision.reason}`
  );
}

export function logStep(message) {
  console.log(`[TEST STEP] ${message}`);
}

export function logSummary(message) {
  console.log(`[SUMMARY] ${message}`);
}

export function logAIValidation(decision) {
  const status = decision.status || (decision.isValid ? 'PASS' : 'FAIL');
  const reason = decision.reason || 'No reason provided';
  console.log('[AI VALIDATION]');
  console.log(`Status : ${status}`);
  console.log(`Reason : ${reason}`);
}

export function logTestResult({ status, score = null, reason = null }) {
  console.log('[TEST RESULT]');
  console.log(`Status : ${status}`);
  if (score !== null) {
    console.log(`Score  : ${score}/100`);
  }
  if (reason) {
    console.log(`Reason : ${reason}`);
  }
}

export function logStep(message) {
  console.log(`[TEST STEP] ${message}`);
}

export function logSummary(message) {
  console.log(`[SUMMARY] ${message}`);
}

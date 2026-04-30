# Domain Scenario Pack: Checkout and Payments

This scenario pack models payment-critical API behavior with explicit business invariants and risk-based prioritization.

## Why this pack exists

Checkout/payments flows are high-impact and failure-sensitive. This pack demonstrates how AI-assisted validation can be paired with deterministic gates for practical business-critical testing.

## Risk-Based Prioritization

| Scenario ID | Risk | Scenario | Priority Rule |
| --- | --- | --- | --- |
| `PAY-CRIT-001` | Critical | Authorized payment must create settled order | Must pass in PR, nightly, and release runs |
| `PAY-HIGH-002` | High | Insufficient funds must not place order | Must pass in nightly and release runs |
| `PAY-MED-003` | Medium | Idempotent retry keeps single order identity | Required for nightly regression and release readiness |

## Explicit Business Invariants

- Captured payment amount must equal order total.
- Failed authorization must keep order in `payment_failed` state.
- Idempotent retry must reuse prior order identity (no duplicate order creation).

## Execution

- Test file: `tests/integration/checkoutPaymentsScenario.test.js`
- Run with:

```bash
npm run test:integration
```

## Guardrail Pattern Used

- Schema gate (`createSchemaDecision`) checks required fields first.
- Invariant assertion checks business correctness second.
- Risk tier metadata drives prioritization policy.

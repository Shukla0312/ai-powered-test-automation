# AI Safety and Evaluation Policy

This document defines how AI-assisted validation is evaluated in this project, including explicit failure modes and acceptance thresholds by scenario type.

## Scope

This policy applies to semantic validation performed by `utils/aiValidator.js` and `utils/aiDecisionEngine.js`, with deterministic checks from schema gates in front of AI evaluation.

## Safety Principles

- Deterministic checks first, AI checks second.
- Fail closed on malformed or ambiguous AI outputs.
- Prefer explainable outcomes (`PASS/FAIL`, score, reason) over opaque model responses.
- Use mock mode in PR/CI fast paths to control cost and reduce external nondeterminism.

## Failure Modes

The following are treated as safety-relevant failures:

- **Schema contract failure**: required field missing, null/empty required value.
- **Low-confidence semantic decision**: model marks valid but score is below configured threshold.
- **Malformed model output**: invalid JSON, incomplete JSON payload, missing required decision keys.
- **Provider/runtime failure**: timeout, rate limit exhaustion, provider error.
- **Contradictory decision content**: response indicates both pass/fail semantics or lacks clear reason.
- **External dependency instability**: upstream API/network instability causes non-functional failures.

## Scenario Types and Acceptance Thresholds

These thresholds are baseline defaults for this repository.

| Scenario Type | Purpose | Deterministic Gate | Minimum Semantic Score | Acceptance Rule |
| --- | --- | --- | --- | --- |
| Contract/schema validation | Verify required structure exists | Required fields must pass | N/A when schema fails | Immediate FAIL on missing required fields |
| Core functional API response | Validate expected business meaning | Required fields when defined | 75 | PASS only if `isValid=true` and score >= 75 |
| Business-critical workflow readiness | Validate onboarding/critical readiness | Strict required schema | 80 | PASS only if schema passes and score >= 80 |
| Batch semantic validation | Validate multiple similar responses | Per-item schema optional | 75 per item | Suite PASS requires all items pass |
| Negative/error-path validation | Ensure bad states are rejected | Expected error status required | N/A for expected rejected path | PASS when failure is expected and correctly identified |
| Mock-mode CI smoke validation | Fast deterministic pipeline signal | Fixture-based deterministic API | 75 | PASS if all deterministic + mock semantic checks pass |

## Decision Contract Requirements

A valid AI decision must include:

- `isValid` (boolean)
- `validationScore` (number)
- `issues` (array, may be empty)
- `reason` or derivable reason text

If this contract is not met, validation must be treated as FAIL.

## CI and Environment Policy

- Pull requests should run with `USE_MOCK_AI=true` for deterministic and cost-controlled checks.
- Real-model runs should be used for periodic or release-candidate validation.
- Test artifacts (JSON + JUnit XML) must be retained for post-failure triage.

## Escalation and Triage Guidance

When validation fails:

1. Check deterministic schema/HTTP failures first.
2. Check provider/runtime errors (timeouts, rate limits, parsing).
3. Review semantic decision score and reason text.
4. If model output is malformed or ambiguous, treat as safety failure and do not auto-override.

## Change Control

Changes to thresholds or acceptance rules should be reviewed with:

- Rationale (risk/cost trade-off)
- Affected scenario types
- Expected impact on false positives/false negatives

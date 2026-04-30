# Suite Orchestration Strategy (1000+ Tests)

This document defines how this framework scales from a small suite to high-volume execution (1000+ tests) while keeping reliability, cost, and tenant safety under control.

## Objectives

- Keep feedback fast in pull requests.
- Prevent provider throttling and budget spikes.
- Isolate tenant/domain execution to reduce blast radius.
- Maintain auditable governance for AI-assisted validation.

## Execution Model

Use a two-stage model:

1. **Planning stage (control plane)**  
   Build an execution plan with metadata per test:
   - domain (payments, onboarding, search, etc.)
   - tenant/environment
   - risk tier (critical/high/medium/low)
   - AI mode (mock/real)
   - estimated token/cost profile

2. **Worker stage (data plane)**  
   Execute planned work in bounded workers with queue controls and retry policy.

## Sharding Strategy

Shards are created deterministically to improve cache reuse and reproducibility.

- **Primary shard key**: `domain + risk tier`
- **Secondary key**: `tenant`
- **Tertiary key**: hash of test id/name (for even balancing)

Recommended defaults:

- PR runs: 2-4 shards, mock mode, critical + high only
- Nightly runs: 6-12 shards, mixed mock/real by policy
- Release candidate runs: full shard set, real AI for critical paths

## Queueing and Concurrency Controls

Use queue-based orchestration instead of unbounded parallelism.

- Global concurrency cap per provider
- Per-tenant concurrency cap
- Per-domain cap for high-cost scenarios
- Backpressure when rate-limit/error thresholds are crossed

Queue priority order:

1. Critical + customer-facing flows
2. High-risk domain tests
3. Medium/low regression packs

## Tenant Isolation

For multi-tenant usage, isolate execution and artifacts by tenant boundary.

- Separate tenant test queues
- Isolated fixture/input sets per tenant
- Tenant-tagged logs and reports
- Tenant-level circuit breaker when instability is detected

## Governance and Policy Enforcement

AI governance checks run before execution:

- Verify scenario has threshold policy mapping (`docs/ai-safety-evaluation-policy.md`)
- Validate allowed model/provider for environment
- Enforce cost guardrails (token budget ceiling per run)
- Deny execution for tests missing deterministic schema gate where required

## Failure Handling and Recovery

- Retry only retryable infrastructure/provider failures.
- Do not auto-retry semantic failures without root-cause classification.
- Quarantine flaky tests after threshold breaches.
- Continue-on-failure at shard level; fail run based on risk policy:
  - any critical failure => run fails
  - high-risk failure budget exceeded => run fails

## Metrics Required for Scale Readiness

- Queue latency per shard
- Pass/fail by risk tier and tenant
- Provider rate-limit events and retry exhaustion
- Cost per run and cost per domain
- Flaky test rate and quarantine count

## Suggested Rollout Plan

1. Add metadata tags to all tests (`domain`, `risk`, `tenant`, `aiMode`).
2. Introduce deterministic shard planner (static config first).
3. Add bounded worker pool with provider/tenant caps.
4. Add policy gate + budget gate in CI before execution.
5. Expand artifact reports with shard/tenant/risk dimensions.

## Minimal CI Profiles

- **PR profile**: mock-only, critical/high tests, strict runtime cap.
- **Nightly profile**: full mock + targeted real-AI set.
- **Release profile**: full suite with governance and cost checks enabled.

# AI-Powered Test Automation Framework

AI-powered testing framework that replaces brittle assertions with semantic validation using LLMs.

![CI](https://github.com/Shukla0312/ai-powered-test-automation/actions/workflows/test.yml/badge.svg)

Production-aware API validation framework built for SDET and startup engineering workflows. It combines deterministic HTTP automation with AI-assisted validation so tests can evaluate whether a response is logically correct for a business scenario, not only whether it matches hardcoded values.

## ⚡ Quick Demo

```bash
npm test
```

```text
[TEST STEP] Running: Validate User Response with Schema
[AI VALIDATION] PASS - Response contains valid structure and required fields
Reason: Response contains identity, contact, and company information.

TEST REPORT
Total Tests: 5
Passed: 5
Failed: 0
All tests passed!
```

In five seconds, this shows the core value: the framework calls an API, validates the response with AI, prints the decision, and explains the reason.

## 📸 Sample Execution

Command:

```bash
npm test
```

Sample output:

```text
[TEST STEP] Running: Validate User Response with Schema
GET /users/1 [200] 715ms
[AI VALIDATION] PASS - Response is logically valid with score 100/100
PASS - Validation Score: 100/100
Reason: Response contains identity, contact, and company information.

[TEST STEP] Running: Real-World User Onboarding Validation
[AI VALIDATION] PASS - Response is logically valid with score 100/100
[AI VALIDATION] FAIL - Missing required field(s): email
[AI VALIDATION] PASS - Missing email edge case rejected: Missing required field(s): email

TEST REPORT
Total Tests: 5
Passed: 5
Failed: 0
All tests passed!
```

Visual proof options:

- Add a terminal screenshot showing `npm test` passing under `docs/`.
- Use the checked-in sanitized log file at `docs/sample-output.txt`.
- Placeholder if no screenshot is committed yet: `docs/sample-output.txt` is the execution proof artifact.

Generate a fresh sanitized log:

```bash
npm run test:mock > docs/sample-output.txt
```

Do not include API keys, raw secrets, or sensitive payloads in screenshots or logs.

## Overview

Traditional API automation is strong at status codes and exact contracts, but it can be brittle when validating whether data is meaningful for a workflow. This framework keeps deterministic checks for contracts and adds AI validation for semantic quality.

Current API under test:

```text
https://jsonplaceholder.typicode.com
```

Covered scenarios:

- `GET /posts/1`: validates a successful blog post response.
- `GET /users/1`: validates a user profile response with required fields.
- `GET /posts/99999`: validates expected error handling for a missing resource.
- `GET /posts/1` and `GET /posts/2`: validates multiple responses in a controlled batch.
- CRM onboarding scenario: validates identity, contact, address, and company readiness.
- Missing-email edge case: proves incomplete business data is rejected.

## Key Capabilities

- AI-based semantic API validation with clear `PASS/FAIL` decisions.
- Deterministic schema gates before AI calls for required fields.
- Provider abstraction for Anthropic and OpenAI.
- Mock AI mode for low-cost local and CI smoke tests.
- Retry logic, timeout handling, and request history.
- Validation result caching for repeated response/expectation pairs.
- Sequential batch validation to reduce provider throttling and cost risk.
- Unit tests for the AI decision engine.

## Architecture

```text
ai-powered-test-automation/
├── .github/workflows/
│   └── test.yml
├── config/
│   ├── config.js
│   └── index.js
├── docs/
│   └── sample-output.txt
├── examples/
│   └── real-world-scenario.js
├── prompts/
│   └── validationPrompts.js
├── services/
│   └── apiService.js
├── tests/
│   ├── ai-validation.test.js
│   └── unit/
│       └── aiDecisionEngine.test.js
├── utils/
│   ├── aiDecisionEngine.js
│   ├── aiValidator.js
│   ├── anthropicClient.js
│   ├── llmFactory.js
│   ├── logger.js
│   └── openaiClient.js
├── .env.example
├── package.json
└── README.md
```

## Execution Flow

```text
npm test
   |
   v
tests/ai-validation.test.js
   |
   v
services/apiService.js
   |  base URL, timeout, retry handling
   v
utils/aiValidator.js
   |  schema gate, prompt building, cache lookup
   v
utils/llmFactory.js
   |  Anthropic or OpenAI provider
   v
utils/aiDecisionEngine.js
   |  normalizes raw AI response into PASS/FAIL + reason
   v
[AI VALIDATION] PASS - reason
```

## Example Scenario

The real-world scenario validates whether a user profile is ready for CRM onboarding:

```javascript
await validator.validateResponse(
  userData,
  `User profile should include identity, contact, address, and company details`,
  {
    schema: {
      required: ['id', 'name', 'username', 'email', 'phone', 'address', 'company'],
    },
    minScore: 80,
    testName: 'Real-World User Onboarding Validation',
  }
);
```

The same test removes `email` and verifies the framework rejects the incomplete profile before relying on AI-only judgment.

Run the standalone example:

```bash
node examples/real-world-scenario.js
```

## ⚖️ Traditional vs AI Testing

```javascript
// Traditional: brittle exact-value assertion
expect(response.email).toBe('abc@test.com');

// AI-based: validates business intent and response quality
await validator.validateResponse(
  response,
  'User profile should include valid contact and company details'
);
```

| Area | Traditional API Test | AI-Powered Validation |
| --- | --- | --- |
| Assertion style | Exact field/value checks | Semantic and business-intent checks |
| Maintenance | Breaks when harmless response details change | More tolerant of acceptable variation |
| Signal | "Field exists" | "Response is logically valid for the workflow" |
| Best use | Contracts, status codes, required fields | Data quality, completeness, workflow readiness |
| Risk | Low ambiguity | Requires controls for nondeterminism |

The framework uses both: deterministic checks for contracts, AI validation for meaning.

## ⚙️ Configuration

Runtime configuration is centralized in `config/config.js`.

Key configuration controls:

- Retry count: `MAX_RETRIES`
- Mock vs real AI mode: `USE_MOCK_AI`
- Timeout: `API_TIMEOUT`
- Base URL: `API_BASE_URL`

Example config shape:

```javascript
export const config = {
  execution: {
    retryCount: 3,
    aiMode: 'real',
    useMockAI: false,
    timeout: 30000,
    baseUrl: 'https://jsonplaceholder.typicode.com',
  },
};
```

Environment variables:

```text
LLM_PROVIDER=anthropic
USE_MOCK_AI=false
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo
API_BASE_URL=https://jsonplaceholder.typicode.com
API_TIMEOUT=30000
MAX_RETRIES=3
RETRY_DELAY_MS=1000
FLAKY_TEST_THRESHOLD=0.3
LOG_LEVEL=info
```

Local setup:

```bash
npm install
cp .env.example .env
```

Run real AI validation:

```bash
npm test
```

Run mock validation without paid LLM calls:

```bash
npm run test:mock
```

Run unit tests:

```bash
npm run test:unit
```

## 📈 Scalability

- Modular architecture supports adding large suites under `tests/` without coupling API, prompt, provider, and decision logic.
- CI/CD integration supports pull request validation and can be extended to scheduled real-AI regression runs.
- `llmFactory.js` keeps provider selection isolated, so additional LLM providers can be added without rewriting tests.
- Prompt templates under `prompts/` allow domain-specific validation patterns for checkout, CRM, payments, search, or internal services.
- Sequential batch AI validation controls provider cost and rate-limit pressure; concurrency can be introduced later behind a controlled queue.

## ⚠️ Limitations

| Limitation | Risk |
| --- | --- |
| AI responses are non-deterministic | Results may vary across runs |
| Rate limits | Provider throttling can fail tests |
| Cost | Real LLM calls cost money |
| External API dependency | Public API/network failures can break runs |
| AI is not a strict contract validator | It may miss schema-level issues if used alone |

## ✅ Mitigation

- Retry with exponential backoff for rate limits, timeouts, and transient failures.
- Response caching for repeated response/expectation pairs.
- Sequential execution for controlled concurrency and cost.
- Deterministic schema gates before AI calls.
- Mock AI mode for pull requests, smoke tests, and low-cost CI.
- Low temperature and explicit prompts for more stable model behavior.

## CI/CD

Workflow:

```text
.github/workflows/test.yml
```

The workflow runs on push, pull request, and manual dispatch.

Secrets:

```text
ANTHROPIC_API_KEY
OPENAI_API_KEY
```

Repository variables can override non-secret settings:

```text
LLM_PROVIDER
USE_MOCK_AI
API_BASE_URL
API_TIMEOUT
MAX_RETRIES
RETRY_DELAY_MS
```

## 🎯 Key Takeaway

This framework shows how AI can reduce brittle API tests by validating intent instead of only exact values. It improves validation quality by combining deterministic schema checks with semantic AI reasoning, while acknowledging real production constraints like cost, rate limits, nondeterminism, and CI reliability.

That is the core engineering idea: AI is useful in testing when it is wrapped in controls, not when it replaces the test strategy.

## Roadmap

- Add domain-specific scenario packs for ecommerce, CRM, and payments APIs.
- Add optional HTML/JSON test reports for CI artifacts.
- Add provider health checks before real-AI runs.
- Add configurable concurrency controls for larger suites.
- Add contract-test integration for OpenAPI schemas.

## Security

- Keep `.env` local only.
- Store CI keys in GitHub Secrets.
- Do not commit screenshots or logs that contain secrets.
- Rotate keys if they are exposed in terminal output, git history, or screenshots.

## License

MIT

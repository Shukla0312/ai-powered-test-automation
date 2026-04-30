# AI-Powered Test Automation Framework

![CI](https://github.com/Shukla0312/ai-powered-test-automation/actions/workflows/test.yml/badge.svg)

Production-minded API validation framework that combines deterministic HTTP automation with AI-assisted semantic validation. The goal is to reduce brittle assertions by validating whether an API response is logically correct for a business scenario, not only whether it matches hardcoded values.

This project is built as a portfolio-quality SDET framework with modular services, provider abstraction, retry logic, validation caching, CI support, and realistic test scenarios.

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

In five seconds, this shows the core value: the framework makes an API call, asks AI to validate the response semantically, prints the decision, and explains the reason.

## What This Tests

The current suite uses the public JSONPlaceholder API:

```text
https://jsonplaceholder.typicode.com
```

Covered scenarios:

- `GET /posts/1`: validates a successful blog post response.
- `GET /users/1`: validates a user profile response with required fields.
- `GET /posts/99999`: validates API error handling for a missing resource.
- `GET /posts/1` and `GET /posts/2`: validates multiple responses in a batch.
- CRM onboarding scenario: validates a user profile for identity, contact, address, and company readiness.
- Missing-email edge case: verifies that an incomplete user profile is rejected.

## Execution Flow

```text
npm test
   |
   v
tests/ai-validation.test.js
   |
   v
services/apiService.js
   |  - base URL
   |  - timeout
   |  - retry handling
   v
utils/aiValidator.js
   |  - builds prompt
   |  - checks cache
   |  - calls selected provider
   v
utils/llmFactory.js
   |  - Anthropic
   |  - OpenAI
   v
utils/aiDecisionEngine.js
   |  - parses AI output
   |  - normalizes PASS/FAIL
   v
[AI VALIDATION] PASS - reason
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
| Best use | Contracts, status codes, required fields | Data quality, completeness, real-world readiness |
| Risk | Low ambiguity | Requires controls for nondeterminism |

The framework keeps both approaches: deterministic checks handle contracts and status codes, while AI validation handles meaning, completeness, and workflow readiness.

## Project Structure

```text
ai-powered-test-automation/
├── .github/workflows/
│   └── test.yml
├── config/
│   ├── config.js
│   └── index.js
├── examples/
│   └── real-world-scenario.js
├── prompts/
│   └── validationPrompts.js
├── services/
│   └── apiService.js
├── tests/
│   └── ai-validation.test.js
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

## ⚙️ Configuration

Runtime configuration is centralized in `config/config.js`.

Key values:

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

Configuration controls:

- Retry count: `MAX_RETRIES` controls API/provider retry attempts.
- Mock vs real AI mode: `USE_MOCK_AI=true` runs without paid LLM calls; `false` uses the configured provider.
- Timeout: `API_TIMEOUT` controls HTTP request timeout.
- Base URL: `API_BASE_URL` points the suite to the API under test.

Use `USE_MOCK_AI=true` for local smoke tests or CI runs where you want framework validation without using paid LLM calls.

## Local Setup

```bash
npm install
cp .env.example .env
```

For real Anthropic validation, set:

```text
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key_here
USE_MOCK_AI=false
```

For mock validation:

```text
USE_MOCK_AI=true
```

Run tests:

```bash
npm test
```

Run without real AI cost:

```bash
npm run test:mock
```

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
[AI VALIDATION] FAIL - email is required
[AI VALIDATION] PASS - Missing email edge case rejected: email is required

TEST REPORT
Total Tests: 5
Passed: 5
Failed: 0
All tests passed!
```

Screenshot or log proof:

- A terminal screenshot showing `npm test` passing.
- A checked-in sanitized log file under `docs/sample-output.txt`.
- Placeholder if no screenshot is committed yet: `docs/sample-output.txt` provides copy/paste-safe proof of execution.

Suggested command for generating a clean log:

```bash
npm run test:mock > docs/sample-output.txt
```

Do not include API keys, raw secrets, or sensitive payloads in screenshots or logs.

## AI Decision Engine

`utils/aiDecisionEngine.js` isolates AI interpretation from test execution.

It returns a stable contract:

```javascript
{
  status: 'PASS',
  reason: 'Response is logically valid with score 100/100'
}
```

The validator uses this layer so test code does not need to parse raw LLM output.

## Logging

The framework uses consistent log prefixes:

```text
[TEST STEP] Running: Validate User Response with Schema
[AI VALIDATION] PASS - Response is logically valid
[SUMMARY] API Requests: 6
```

This makes terminal output easier to scan in local runs and CI logs.

## CI/CD

GitHub Actions workflow:

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

## ⚠️ Limitations

| Limitation | Risk | Mitigation |
| --- | --- | --- |
| Non-deterministic AI behavior | Different responses across runs | Use low temperature, explicit prompts, validation thresholds, and cache repeated validations |
| Rate limits | Provider throttling can fail tests | Retry logic with exponential backoff and sequential execution |
| Cost | Real LLM calls cost money | Use `USE_MOCK_AI=true` for smoke tests and reserve real AI runs for targeted suites |
| External API dependency | Public API/network failures can break runs | Configurable base URL, timeout, retry count, and mock AI mode |
| AI is not a contract validator | It may miss strict schema issues | Keep deterministic checks for status codes and required fields alongside AI validation |

## ✅ Mitigation

- Retry with exponential backoff for rate limits, timeouts, and transient provider failures.
- Response caching to avoid repeated AI validation for identical response/expectation pairs.
- Sequential execution for batch AI validation to control cost and reduce throttling risk.
- Deterministic schema gates before AI calls for required-field failures.
- Mock AI mode for pull requests, smoke tests, and low-cost CI validation.

## Extensibility

The framework is designed for multiple LLM providers through `utils/llmFactory.js`.

To add another provider:

1. Add a provider client in `utils/`.
2. Implement `getCompletion` and `getJSONCompletion`.
3. Register it in `llmFactory.js`.
4. Add provider-specific config in `config/config.js`.

To scale the framework:

- Add domain-specific prompt templates under `prompts/`.
- Add service clients for internal APIs under `services/`.
- Add scenario suites under `tests/`.
- Store sanitized execution logs under `docs/`.
- Run mock AI on every PR and real AI on scheduled or release workflows.

## Production Signals

- Centralized config layer
- Provider abstraction for Anthropic and OpenAI
- Retry logic for API and provider calls
- Validation result caching
- Structured AI decision engine
- CI workflow with GitHub Secrets support
- Real-world positive and negative test scenarios
- Clear limitations and mitigation strategy

## Useful Commands

```bash
npm install
npm test
npm run test:mock
node examples/real-world-scenario.js
```

## Security

- Keep `.env` local only.
- Store CI keys in GitHub Secrets.
- Do not commit screenshots or logs that contain secrets.
- Rotate keys if they are exposed in terminal output, git history, or screenshots.

## License

MIT

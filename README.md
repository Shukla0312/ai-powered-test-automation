# AI-Powered Test Automation Framework

A Node.js test automation framework that uses an LLM to validate API responses semantically. Instead of relying only on brittle exact-value assertions, tests can describe the expected behavior and let the configured provider validate whether the response is meaningful, complete, and correctly shaped.

The framework supports both Anthropic Claude and OpenAI through `LLM_PROVIDER`.

## Features

- Semantic API response validation using Anthropic or OpenAI
- Batch validation for multiple responses
- Response comparison for semantic equivalence
- Flaky test analysis from execution history
- HTTP service with retries, timeouts, and request history
- GitHub Actions workflow that reads API keys from GitHub Secrets

## Project Structure

```text
ai-powered-test-automation/
├── .github/workflows/
│   └── ai-validation.yml        # CI workflow using GitHub Secrets
├── config/
│   └── index.js                 # Centralized runtime configuration
├── prompts/
│   └── validationPrompts.js     # LLM prompt templates
├── services/
│   └── apiService.js            # Axios-based API client
├── tests/
│   └── ai-validation.test.js    # Example AI validation test suite
├── utils/
│   ├── aiValidator.js           # Semantic validation engine
│   ├── anthropicClient.js       # Anthropic client wrapper
│   ├── llmFactory.js            # Provider selection
│   └── openaiClient.js          # OpenAI client wrapper
├── .env.example                 # Safe local environment template
├── package.json
└── README.md
```

## Prerequisites

- Node.js 18+
- npm
- An API key for the provider you want to use:
  - Anthropic: `ANTHROPIC_API_KEY`
  - OpenAI: `OPENAI_API_KEY`

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

For the default Anthropic setup, fill in these values in `.env`:

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_new_anthropic_key
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
API_BASE_URL=https://jsonplaceholder.typicode.com
```

For OpenAI instead:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_new_openai_key
OPENAI_MODEL=gpt-3.5-turbo
API_BASE_URL=https://jsonplaceholder.typicode.com
```

`.env` is ignored by git. Do not commit real API keys.

Run the sample validation suite:

```bash
node tests/ai-validation.test.js
```

You can also use the package script:

```bash
npm run dev
```

## GitHub Secrets Setup

The CI workflow in `.github/workflows/ai-validation.yml` reads API keys from GitHub Actions secrets. Add secrets in:

```text
GitHub repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

Add the secret for your selected provider:

```text
ANTHROPIC_API_KEY
```

or:

```text
OPENAI_API_KEY
```

The workflow defaults to Anthropic. Optional non-secret configuration can be set in GitHub Actions repository variables:

```text
LLM_PROVIDER
ANTHROPIC_MODEL
OPENAI_MODEL
API_BASE_URL
API_TIMEOUT
MAX_RETRIES
FLAKY_TEST_THRESHOLD
LOG_LEVEL
```

Default CI values:

```text
LLM_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
API_BASE_URL=https://jsonplaceholder.typicode.com
API_TIMEOUT=30000
MAX_RETRIES=3
FLAKY_TEST_THRESHOLD=0.3
LOG_LEVEL=info
```

## Configuration Reference

| Variable | Required | Description |
| --- | --- | --- |
| `LLM_PROVIDER` | No | `anthropic` or `openai`. Defaults to `openai` in code, while `.env.example` and CI use `anthropic`. |
| `ANTHROPIC_API_KEY` | If using Anthropic | Anthropic API key. Store in GitHub Secrets for CI. |
| `ANTHROPIC_MODEL` | No | Anthropic model. Defaults to `claude-sonnet-4-5-20250929`. |
| `ANTHROPIC_TEMPERATURE` | No | Claude temperature. Defaults to `0.3`. |
| `OPENAI_API_KEY` | If using OpenAI | OpenAI API key. Store in GitHub Secrets for CI. |
| `OPENAI_MODEL` | No | OpenAI model. Defaults to `gpt-3.5-turbo`. |
| `OPENAI_TEMPERATURE` | No | OpenAI temperature. Defaults to `0.3`. |
| `API_BASE_URL` | No | Base URL for test API calls. |
| `API_TIMEOUT` | No | API timeout in milliseconds. Defaults to `30000`. |
| `MAX_RETRIES` | No | Retry attempts for retryable API failures. Defaults to `3`. |
| `FLAKY_TEST_THRESHOLD` | No | Failure-rate threshold for flaky test analysis. Defaults to `0.3`. |
| `LOG_LEVEL` | No | Logging verbosity. Defaults to `info`. |

## Usage Example

```javascript
import SemanticValidator from './utils/aiValidator.js';
import APIService from './services/apiService.js';

const validator = new SemanticValidator();
const apiService = new APIService();

const response = await apiService.get('/users/1');

const result = await validator.validateResponse(
  response,
  'Response should contain a valid user with id, name, email, phone, and company information',
  { testName: 'Validate User Response' }
);

console.log(result.validationScore);
```

## Batch Validation

```javascript
const results = await validator.batchValidate([
  {
    response: post,
    expectedBehavior: 'Valid blog post with title and body',
    options: { testName: 'Post Validation' },
  },
  {
    response: user,
    expectedBehavior: 'Valid user with contact information',
    options: { testName: 'User Validation' },
  },
]);

const allPassed = results.every((result) => result.isValid);
```

## Flaky Test Analysis

```javascript
const analysis = await validator.analyzeFlakiness(
  [
    { status: 'PASS', duration: 125, timestamp: '2026-04-30T10:00:00Z' },
    { status: 'FAIL', duration: 2500, timestamp: '2026-04-30T10:05:00Z' },
    { status: 'PASS', duration: 130, timestamp: '2026-04-30T10:10:00Z' },
  ],
  'checkout_flow_test'
);

console.log(analysis.isFlaky);
```

## Test Output

The sample test prints:

- Current provider, model, and API base URL
- API request status and duration
- Validation scores
- Batch validation summary
- Final test report

Expected passing summary:

```text
Total Tests: 4
Passed: 4
Failed: 0
All tests passed!
```

## Security Notes

- Never commit `.env` or real API keys.
- Use `.env.example` as the template for local setup.
- Store CI keys in GitHub Secrets, not repository variables.
- If a key is accidentally printed or committed, revoke it and create a new one.
- Keep request logs free of sensitive payloads.

## Troubleshooting

`ANTHROPIC_API_KEY environment variable is required for Anthropic provider.`

Set `ANTHROPIC_API_KEY` locally in `.env`, or add it as a GitHub Actions secret for CI.

`OPENAI_API_KEY environment variable is required for OpenAI provider.`

Set `OPENAI_API_KEY` locally in `.env`, or add it as a GitHub Actions secret for CI.

`getaddrinfo ENOTFOUND jsonplaceholder.typicode.com`

The test could not reach the sample API. Check network access and `API_BASE_URL`.

`model ... not_found_error`

The configured model is unavailable for your account or retired. Update `ANTHROPIC_MODEL` or `OPENAI_MODEL`.

## Useful Commands

```bash
npm install
npm run dev
npm test
node tests/ai-validation.test.js
```

## License

MIT

# 🚀 AI-Powered Test Automation Framework

![CI](https://github.com/Shukla0312/ai-powered-test-automation/actions/workflows/ai-validation.yml/badge.svg)

## 🧠 Overview

This project demonstrates how Large Language Models (LLMs) can enhance traditional test automation by enabling **semantic validation** instead of brittle assertions.

Instead of checking exact values, this framework uses AI to evaluate whether an API response is **logically correct, complete, and consistent**.

---

## ✨ Key Capabilities

- 🔍 **AI-Based API Validation**
  - Validates responses using LLM reasoning instead of static assertions

- 🧪 **Intelligent Test Case Generation**
  - Generates positive, negative, and edge test cases using AI

- 🔁 **Flaky Test Detection**
  - Identifies inconsistent test outcomes across multiple runs

- 🧱 **Modular Architecture**
  - Clean separation of API, AI, and test layers

---

## 💡 Why This Matters

### Traditional Testing
- Exact value assertions  
- High maintenance  
- Brittle tests  

### AI-Powered Testing
- Semantic validation  
- Flexible assertions  
- Better coverage with less effort  

👉 This approach reduces false failures and improves test resilience.

---

## 🏗️ Architecture

```text
tests/ai-validation.test.js
        │
        ▼
services/apiService.js          -> calls the API under test
        │
        ▼
utils/aiValidator.js            -> builds validation prompts and caches results
        │
        ▼
utils/llmFactory.js             -> chooses Anthropic or OpenAI
        │
        ▼
utils/aiDecisionEngine.js       -> converts AI output into PASS/FAIL decisions
```

---

## ✅ Current Coverage

The sample suite tests the public JSONPlaceholder API:

```text
https://jsonplaceholder.typicode.com
```

Covered cases:

- `GET /posts/1` validates a successful blog post response.
- `GET /users/1` validates a user profile response with required fields.
- `GET /posts/99999` validates error handling for a missing resource.
- `GET /posts/1` and `GET /posts/2` validate multiple responses in a batch.

---

## 🌍 Real-World Scenario Code

A CRM-style onboarding validation example is included at:

```text
examples/real-world-scenario.js
```

Run it with:

```bash
node examples/real-world-scenario.js
```

Scenario covered:

- Fetches a customer profile from `/users/1`
- Validates identity, contact, address, and company information
- Uses semantic AI validation to decide whether the profile is ready for CRM onboarding

---

## ⚙️ Config System

Runtime configuration lives in `config/index.js` and is loaded from environment variables.

Example:

```javascript
export const config = {
  framework: {
    retries: 3,
    useMockAI: false,
  },
};
```

Important config values:

```text
LLM_PROVIDER=anthropic
USE_MOCK_AI=false
MAX_RETRIES=3
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
API_BASE_URL=https://jsonplaceholder.typicode.com
```

Use `USE_MOCK_AI=true` when you want to exercise the framework flow without calling a real LLM.

---

## 🧠 AI Decision Engine Layer

The project now separates AI response interpretation from test execution.

Decision engine file:

```text
utils/aiDecisionEngine.js
```

Example:

```javascript
import { interpretAIResponse } from './utils/aiDecisionEngine.js';

const decision = interpretAIResponse({
  isValid: true,
  validationScore: 92,
  issues: [],
});

console.log(decision.isValid); // true
```

This keeps the test flow clean:

```text
API response -> AI validation -> decision engine -> PASS/FAIL
```

---

## 🔐 Secrets and CI/CD

The GitHub Actions workflow is:

```text
.github/workflows/ai-validation.yml
```

Store API keys in GitHub Secrets:

```text
ANTHROPIC_API_KEY
OPENAI_API_KEY
```

Do not commit real keys in `.env`.

---

## ✅ Project Checklist

- `.env.example` ✔
- `.gitignore` ✔
- Retry logic ✔
- Caching ✔
- CI/CD badge ✔
- Config system ✔
- AI decision engine layer ✔
- Real-world scenario code ✔

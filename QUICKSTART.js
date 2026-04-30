#!/usr/bin/env node

/**
 * QUICK START GUIDE
 * 
 * This file explains how to get the framework running immediately
 * Complete setup in 5 minutes
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║   AI-POWERED TEST AUTOMATION FRAMEWORK - QUICK START          ║
╚═══════════════════════════════════════════════════════════════╝

📋 WHAT YOU JUST GOT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Production-ready test automation framework
✓ OpenAI integration with retry logic
✓ Semantic API response validation
✓ Clean architecture with separation of concerns
✓ Example test suite with 4 working examples
✓ Comprehensive error handling


🚀 5-MINUTE SETUP:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Install dependencies
  $ npm install

Step 2: Configure environment
  $ cp .env.example .env
  $ vim .env (add your OPENAI_API_KEY)

Step 3: Run the test suite
  $ node tests/ai-validation.test.js

Step 4: Review results
  Look for ✓ marks for passed tests
  See detailed validation scores


📁 PROJECT STRUCTURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ai-powered-test-automation/
│
├── config/
│   └── index.js                    ← Centralized configuration
│
├── utils/
│   ├── openaiClient.js             ← OpenAI SDK wrapper
│   └── aiValidator.js              ← Semantic validation engine
│
├── services/
│   └── apiService.js               ← HTTP client with retries
│
├── prompts/
│   └── validationPrompts.js        ← LLM prompt templates
│
├── tests/
│   └── ai-validation.test.js       ← Example test suite
│
├── package.json                    ← Dependencies
├── .env.example                    ← Configuration template
├── README.md                       ← Full documentation
└── ARCHITECTURE.md                 ← Technical deep dive


🧠 THREE KEY CONCEPTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  SEMANTIC VALIDATION (Not Brittle Assertions)
   
   ❌ Old way: 
      assert.equal(response.user.name, 'John')
      → Breaks if field format changes
   
   ✅ New way:
      await validator.validateResponse(response, 
        'Response should contain a user with name and email')
      → Understands intent, flexible to changes


2️⃣  CLEAN ARCHITECTURE (Modular Design)
   
   Each module has one job:
   • config/      → Manage settings
   • utils/       → Core utilities (OpenAI, validation)
   • services/    → HTTP communication
   • prompts/     → LLM interactions
   • tests/       → Example usage


3️⃣  RELIABILITY (Production-Ready)
   
   Automatic retry logic:
   • Exponential backoff for transient failures
   • Smart error classification
   • Rate limit handling
   • Request logging for debugging


💡 TYPICAL USAGE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import SemanticValidator from './utils/aiValidator.js';
import APIService from './services/apiService.js';

// Initialize
const validator = new SemanticValidator();
const api = new APIService();

// Make API request
const response = await api.get('/posts/1');

// Validate using AI (semantic understanding)
const result = await validator.validateResponse(
  response,
  'Response should be a valid blog post with title and body'
);

// Check result
if (result.isValid) {
  console.log('✓ Test passed!');
} else {
  console.log('✗ Validation failed:', result.issues);
}


🔧 CONFIGURATION (.env):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Required:
  OPENAI_API_KEY=sk-your-key-here

Optional (defaults provided):
  OPENAI_MODEL=gpt-4-turbo
  OPENAI_TEMPERATURE=0.3
  API_BASE_URL=https://api.example.com
  API_TIMEOUT=30000
  MAX_RETRIES=3
  FLAKY_TEST_THRESHOLD=0.3
  LOG_LEVEL=info


📊 VALIDATION SCORING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each validation returns a score (0-100):

  80-100  ✓ Excellent    → Response perfectly matches behavior
  70-79   ✓ Good         → Minor discrepancies, still valid
  60-69   ⚠️  Fair         → Several issues, may indicate problems
  <60     ✗ Poor         → Does not match expected behavior


🎯 NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Read the documentation:
   → README.md         (Complete guide)
   → ARCHITECTURE.md   (Technical details)

2. Run the example tests:
   → node tests/ai-validation.test.js

3. Customize for your APIs:
   → Add your API_BASE_URL to .env
   → Create tests in tests/ folder
   → Use the semantic validator

4. Scale to your test suite:
   → Add more test files
   → Integrate with CI/CD
   → Add custom validation logic


📚 FILE REFERENCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

config/index.js (185 lines)
├─ Purpose: Centralize configuration
├─ Key Export: config object
└─ Usage: import config from './config/index.js'

utils/openaiClient.js (287 lines)
├─ Purpose: OpenAI API wrapper
├─ Key Exports: getCompletion(), getJSONCompletion(), AIError
└─ Usage: getCompletion('your prompt here')

utils/aiValidator.js (407 lines)
├─ Purpose: Semantic validation engine
├─ Key Class: SemanticValidator
└─ Usage: validator.validateResponse(response, expectedBehavior)

services/apiService.js (418 lines)
├─ Purpose: HTTP client with reliability
├─ Key Class: APIService
└─ Usage: apiService.get('/endpoint')

prompts/validationPrompts.js (259 lines)
├─ Purpose: LLM prompt templates
├─ Key Exports: getSemanticValidationPrompt, etc.
└─ Usage: Generate prompts for LLM calls

tests/ai-validation.test.js (382 lines)
├─ Purpose: Example test suite
├─ Key Class: TestSuite
└─ Usage: node tests/ai-validation.test.js


🔗 IMPORTANT LINKS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Get OpenAI API Key:
  https://platform.openai.com/account/api-keys

OpenAI API Documentation:
  https://platform.openai.com/docs

Full Framework README:
  ./README.md

Architecture Deep Dive:
  ./ARCHITECTURE.md


⚙️  REQUIRED ENVIRONMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Node.js 18+ (for ES modules)
✓ npm or yarn
✓ OpenAI API key
✓ Internet connection (for API calls)


🆘 TROUBLESHOOTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"OPENAI_API_KEY is required"
  → Check .env file exists and has your API key

"API request failed"
  → Check API_BASE_URL is correct in .env
  → Check API is accessible from your network
  → Check logs for retry attempts

"Validation failed"
  → Check expectedBehavior is clear and specific
  → View validation.issues for details
  → Raise minValidationScore threshold slowly

"Module not found"
  → Run: npm install
  → Check file paths are relative to current directory


🎓 LEARNING FLOW:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Run the example tests
   → Understand what works

2. Read the example test code
   → See patterns and best practices

3. Read the architecture guide
   → Understand how components connect

4. Create your own test
   → Copy example and modify

5. Add more validators
   → Extend SemanticValidator class


═══════════════════════════════════════════════════════════════

✨ Everything is set up and ready to go!
   Run: node tests/ai-validation.test.js

Happy Testing! 🚀

═══════════════════════════════════════════════════════════════
`);

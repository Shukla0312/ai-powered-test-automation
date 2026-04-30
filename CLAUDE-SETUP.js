#!/usr/bin/env node

/**
 * CLAUDE + ANTHROPIC API SETUP GUIDE
 * 
 * This file explains how to use Anthropic's Claude API instead of OpenAI
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║   SWITCHING TO CLAUDE API - SETUP GUIDE                       ║
╚═══════════════════════════════════════════════════════════════╝

✅ GOOD NEWS: The framework now supports BOTH OpenAI and Claude!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


📋 WHY USE CLAUDE INSTEAD OF OPENAI?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Different quota/billing account (might have available credits)
✓ Potentially better performance for code understanding
✓ Different pricing model (may be cheaper for your use case)
✓ Good for testing multiple LLM providers
✓ Redundancy - switch if one service goes down


🚀 QUICK START (2 STEPS):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Get your Claude API key
  a) Go to: https://console.anthropic.com
  b) Sign up or log in
  c) Create a new API key
  d) Copy the key (format: sk-ant-v1-...)

Step 2: Edit your .env file
  
  LLM_PROVIDER=anthropic
  ANTHROPIC_API_KEY=sk-ant-v1-YOUR-KEY-HERE
  
  (Keep OpenAI key if you want to switch back later)

Step 3: Run tests
  $ node tests/ai-validation.test.js


🔧 CONFIGURATION OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In your .env file:

# Choose which provider to use
LLM_PROVIDER=anthropic  # or 'openai'

# Anthropic Claude settings
ANTHROPIC_API_KEY=sk-ant-v1-YOUR-KEY  # Required for Claude
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929  # Default model
ANTHROPIC_TEMPERATURE=0.3  # 0=deterministic, 1=creative

# OpenAI settings (for comparison/fallback)
OPENAI_API_KEY=sk-proj-YOUR-KEY  # Optional
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.3


📊 AVAILABLE CLAUDE MODELS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

claude-3-opus-20240229
  ├─ Most capable, best for complex analysis
  ├─ Cost: ~$15/$75 per 1M tokens
  └─ Latency: ~Higher

claude-sonnet-4-5-20250929  ⭐ RECOMMENDED FOR TESTING
  ├─ Good balance of quality & speed
  ├─ Current recommended Sonnet model
  └─ Latency: ~Medium
  
claude-3-haiku-20240307
  ├─ Fastest & cheapest
  ├─ Cost: ~$0.25/$1.25 per 1M tokens
  └─ Latency: ~Low


💰 ESTIMATED COSTS (FIRST RUN):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Using Claude 3 Sonnet (default):
  - ~4 API calls per test run
  - ~2-5k tokens per call
  - Total: ~$0.05-0.15 per full test run

Much cheaper per test than OpenAI!


🔄 SWITCHING BETWEEN PROVIDERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option 1: Quick Switch in .env
  
  # To use Claude:
  LLM_PROVIDER=anthropic
  
  # To use OpenAI:
  LLM_PROVIDER=openai

Option 2: Programmatic Switch
  
  import { getLLMClient } from './utils/llmFactory.js';
  
  // Will auto-select based on LLM_PROVIDER env var
  const client = getLLMClient();


🧪 TEST WITH CLAUDE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Edit .env:
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-v1-YOUR-KEY

2. Run tests:
   \$ node tests/ai-validation.test.js

3. Watch the logs:
   - Should see API calls to claude API
   - Validates using Claude instead of OpenAI
   - Same validation logic, different LLM


✅ ARCHITECTURE IMPROVEMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The framework now uses a Factory Pattern:

┌─────────────────────┐
│  SemanticValidator  │
└──────────┬──────────┘
           │
           ├─→ getLLMClient()  ← Factory
           │
    ┌──────┴──────┐
    │             │
 OpenAI      Anthropic
  Client       Client
    │             │
    └──────┬──────┘
           │
      LLM API Call

Benefits:
  ✓ Easy to add new providers (Google, Cohere, etc.)
  ✓ Single configuration point
  ✓ No validator code changes needed
  ✓ Testable and maintainable


📁 NEW FRAMEWORK FILES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

utils/
├── openaiClient.js          (OpenAI - unchanged)
├── anthropicClient.js       (NEW - Claude support)
├── llmFactory.js            (NEW - provider selection)
└── aiValidator.js           (Updated - uses factory)

config/
└── index.js                 (Updated - added Anthropic config)


🐛 TROUBLESHOOTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Problem: "ANTHROPIC_API_KEY environment variable is required"
Solution: Add ANTHROPIC_API_KEY to .env with your actual key

Problem: "Unsupported LLM provider: anthropic"
Solution: Check LLM_PROVIDER=anthropic (not 'claude')

Problem: Tests fail with Claude
Solution: 
  - Check API key is valid (starts with sk-ant-v1-)
  - Check account has sufficient credits
  - Claude 3 Sonnet is recommended for testing

Problem: Switching between providers not working
Solution: Make sure you've:
  - Updated LLM_PROVIDER in .env
  - Restarted your test (old client instances cached)
  - Have BOTH keys if testing both


🔗 USEFUL LINKS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Anthropic Console:
  https://console.anthropic.com

Claude API Documentation:
  https://docs.anthropic.com

API Status:
  https://status.anthropic.com

Pricing:
  https://www.anthropic.com/pricing


💡 PRO TIPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Use Claude 3 Haiku for quick cheap tests
   ANTHROPIC_MODEL=claude-3-haiku-20240307

2. Use Claude 3 Opus for complex validations
   ANTHROPIC_MODEL=claude-3-opus-20240229

3. Lower temperature for deterministic results
   ANTHROPIC_TEMPERATURE=0.1

4. Monitor your API usage on console.anthropic.com

5. Set up billing alerts to avoid surprises


🎓 COMPARING PROVIDERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OpenAI GPT-3.5 vs Claude 3 Sonnet:

OpenAI:
  ✓ Wide adoption
  ✓ Many fine-tuning options
  ✗ Higher cost
  ✗ Quota management complex

Claude:
  ✓ Lower cost
  ✓ Good for code analysis
  ✓ Longer context (100k tokens)
  ✗ Fewer fine-tuning options


═══════════════════════════════════════════════════════════════

NEXT STEPS:

1. Get your Claude API key: https://console.anthropic.com
2. Update .env with: LLM_PROVIDER=anthropic
3. Add your API key: ANTHROPIC_API_KEY=sk-ant-v1-...
4. Run: node tests/ai-validation.test.js
5. Enjoy cheaper LLM inference! 🎉

═══════════════════════════════════════════════════════════════
`);

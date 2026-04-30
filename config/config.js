import dotenv from 'dotenv';

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
}

const runtimeConfig = {
  execution: {
    retryCount: toNumber(process.env.MAX_RETRIES, 3),
    aiMode: toBoolean(process.env.USE_MOCK_AI) ? 'mock' : 'real',
    useMockAI: toBoolean(process.env.USE_MOCK_AI),
    timeout: toNumber(process.env.API_TIMEOUT, 30000),
    baseUrl:
      process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com',
  },

  framework: {
    retries: toNumber(process.env.MAX_RETRIES, 3),
    useMockAI: toBoolean(process.env.USE_MOCK_AI),
  },

  llm: {
    provider: process.env.LLM_PROVIDER || 'anthropic',
    providers: {
      openai: {
        keyEnv: 'OPENAI_API_KEY',
        modelEnv: 'OPENAI_MODEL',
      },
      anthropic: {
        keyEnv: 'ANTHROPIC_API_KEY',
        modelEnv: 'ANTHROPIC_MODEL',
      },
      local: {
        keyEnv: null,
        modelEnv: 'LOCAL_LLM_MODEL',
      },
    },
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: toNumber(process.env.OPENAI_TEMPERATURE, 0.3),
    maxTokens: 2000,
    timeout: toNumber(process.env.OPENAI_TIMEOUT, 30000),
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    temperature: toNumber(process.env.ANTHROPIC_TEMPERATURE, 0.3),
    maxTokens: 2000,
    timeout: toNumber(process.env.ANTHROPIC_TIMEOUT, 30000),
  },

  api: {
    baseUrl:
      process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com',
    timeout: toNumber(process.env.API_TIMEOUT, 30000),
    retryAttempts: toNumber(process.env.MAX_RETRIES, 3),
    retryDelay: toNumber(process.env.RETRY_DELAY_MS, 1000),
  },

  test: {
    flakyTestThreshold: toNumber(process.env.FLAKY_TEST_THRESHOLD, 0.3),
    maxRunsForFlakyDetection: 10,
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

export const config = Object.freeze(runtimeConfig);

export function validateConfig(runtimeConfig = config) {
  const provider = runtimeConfig.llm.provider.toLowerCase();
  const usingMockAI = runtimeConfig.framework.useMockAI;

  if (provider === 'openai' && !usingMockAI && !runtimeConfig.openai.apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is required for OpenAI provider.'
    );
  }

  if (
    provider === 'anthropic' &&
    !usingMockAI &&
    !runtimeConfig.anthropic.apiKey
  ) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is required for Anthropic provider.'
    );
  }

  if (!['openai', 'anthropic', 'claude'].includes(provider)) {
    throw new Error(
      `Unsupported LLM_PROVIDER "${runtimeConfig.llm.provider}". Use openai or anthropic.`
    );
  }

  if (!runtimeConfig.api.baseUrl) {
    throw new Error('API_BASE_URL must be configured.');
  }
}

export default config;

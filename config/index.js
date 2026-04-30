/**
 * Central configuration management
 * Loads environment variables and provides validated config object
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuration schema - centralizes all runtime settings
 * Ensures type safety and validates required environment variables
 */
const config = {
  // LLM Provider Selection
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai', // 'openai' or 'anthropic'
  },

  // OpenAI API Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.3,
    maxTokens: 2000,
    timeout: 30000,
  },

  // Anthropic Claude API Configuration
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
    temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.3,
    maxTokens: 2000,
    timeout: 30000,
  },

  // API Service Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://api.example.com',
    timeout: parseInt(process.env.API_TIMEOUT) || 30000,
    retryAttempts: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: 1000, // ms between retries
  },

  // Test Configuration
  test: {
    flakyTestThreshold: parseFloat(process.env.FLAKY_TEST_THRESHOLD) || 0.3,
    maxRunsForFlakyDetection: 10,
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

/**
 * Validate critical configuration on startup
 */
function validateConfig() {
  if (config.llm.provider === 'openai' && !config.openai.apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is required for OpenAI provider.'
    );
  }

  if (config.llm.provider === 'anthropic' && !config.anthropic.apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is required for Anthropic provider.'
    );
  }

  if (!config.api.baseUrl || config.api.baseUrl === 'https://api.example.com') {
    console.warn(
      'Warning: API_BASE_URL is not configured. Using example URL.'
    );
  }
}

/**
 * Validate configuration on module load
 */
try {
  validateConfig();
} catch (error) {
  console.error('Configuration Error:', error.message);
  process.exit(1);
}

export default config;

/**
 * LLM Client Factory
 * Abstraction layer that supports multiple LLM providers (OpenAI, Anthropic Claude, etc.)
 * 
 * Purpose: Decouple the validator from specific LLM implementation
 * Allows switching providers without changing validator code
 */

import config from '../config/index.js';
import * as openaiClient from './openaiClient.js';
import * as anthropicClient from './anthropicClient.js';

/**
 * Get the appropriate LLM client based on configuration
 * 
 * @returns {Object} Client with getCompletion and getJSONCompletion methods
 * @throws {Error} If provider is not supported or not configured
 */
export function getLLMClient() {
  const provider = config.llm.provider.toLowerCase();

  switch (provider) {
    case 'openai':
      return createOpenAIClient();
    case 'anthropic':
    case 'claude':
      return createAnthropicClient();
    default:
      throw new Error(
        `Unsupported LLM provider: ${provider}. Supported: openai, anthropic`
      );
  }
}

/**
 * Create OpenAI client wrapper
 */
function createOpenAIClient() {
  // Validate OpenAI API key
  if (!config.openai.apiKey) {
    throw new Error(
      'OPENAI_API_KEY environment variable is required for OpenAI provider'
    );
  }

  return {
    name: 'OpenAI',
    model: config.openai.model,
    async getCompletion(message, options = {}) {
      return openaiClient.getCompletion(message, options);
    },
    async getJSONCompletion(prompt, schema, options = {}) {
      return openaiClient.getJSONCompletion(prompt, schema, options);
    },
  };
}

/**
 * Create Anthropic Claude client wrapper
 */
function createAnthropicClient() {
  // Validate Anthropic API key
  if (!config.anthropic.apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY environment variable is required for Anthropic provider'
    );
  }

  return {
    name: 'Anthropic Claude',
    model: config.anthropic.model,
    async getCompletion(message, options = {}) {
      return anthropicClient.getCompletion(message, options);
    },
    async getJSONCompletion(prompt, schema, options = {}) {
      return anthropicClient.getJSONCompletion(prompt, schema, options);
    },
  };
}

/**
 * Get available providers for UI/logging
 */
export function getAvailableProviders() {
  return ['openai', 'anthropic'];
}

/**
 * Check if a provider is available (has API key configured)
 */
export function isProviderAvailable(provider) {
  try {
    switch (provider.toLowerCase()) {
      case 'openai':
        return !!config.openai.apiKey;
      case 'anthropic':
      case 'claude':
        return !!config.anthropic.apiKey;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

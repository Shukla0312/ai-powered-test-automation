/**
 * OpenAI Client Wrapper
 * Provides centralized access to OpenAI API with error handling and retry logic
 * 
 * Purpose: Abstract OpenAI SDK complexity, provide reusable prompting interface,
 * handle timeouts, rate limits, and errors gracefully
 */

import { OpenAI } from 'openai';
import config from '../config/index.js';
import { parseJSONFromText } from './jsonResponseParser.js';

/**
 * Singleton instance of OpenAI client
 */
let openaiInstance = null;

/**
 * Initialize OpenAI client with configuration
 * Uses singleton pattern to avoid multiple instances
 * 
 * @returns {OpenAI} Configured OpenAI client
 */
function getOpenAIClient() {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: config.openai.timeout,
      maxRetries: 2, // SDK-level retry
    });
  }
  return openaiInstance;
}

/**
 * Send a message to OpenAI and get completion
 * Implements retry logic for transient failures
 * 
 * @param {string} message - The prompt/message to send
 * @param {Object} options - Optional configuration
 * @param {string} options.model - Model to use (defaults to config model)
 * @param {number} options.temperature - Temperature for response variation
 * @param {number} options.maxTokens - Max tokens in response
 * @param {number} options.retryCount - Current retry attempt (internal)
 * 
 * @returns {Promise<string>} Completion response text
 * @throws {AIError} If API fails after retries
 */
export async function getCompletion(message, options = {}) {
  const {
    model = config.openai.model,
    temperature = config.openai.temperature,
    maxTokens = config.openai.maxTokens,
    retryCount = 0,
  } = options;

  try {
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    // Implement exponential backoff for retries
    const maxRetries = config.api.retryAttempts;
    const waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s...

    if (
      retryCount < maxRetries &&
      (error.status === 429 || error.code === 'RATE_LIMIT_EXCEEDED')
    ) {
      console.warn(
        `Rate limited, retrying in ${waitTime}ms (attempt ${retryCount + 1}/${maxRetries})`
      );
      await sleep(waitTime);
      return getCompletion(message, {
        ...options,
        retryCount: retryCount + 1,
      });
    }

    // Log detailed error information
    console.error('OpenAI API Error:', {
      status: error.status,
      message: error.message,
      retryCount,
    });

    throw new AIError(`Failed to get completion from OpenAI: ${error.message}`, {
      originalError: error,
      retryCount,
    });
  }
}

/**
 * Send a structured prompt with JSON response expectation
 * Useful for parsing structured data (validation results, test cases, etc.)
 * 
 * @param {string} prompt - The prompt to send
 * @param {Object} responseSchema - JSON schema for response validation
 * @param {Object} options - Additional API options
 * 
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {AIError} If response is not valid JSON or validation fails
 */
export async function getJSONCompletion(prompt, responseSchema = null, options = {}) {
  const message = prompt.endsWith('\n\nRespond in JSON format.')
    ? prompt
    : prompt + '\n\nRespond in JSON format.';

  const response = await getCompletion(message, options);

  try {
    const parsed = parseJSONFromText(response);

    // Basic schema validation if provided
    if (responseSchema && !validateSchema(parsed, responseSchema)) {
      throw new AIError('Response does not match expected schema', {
        response: parsed,
        schema: responseSchema,
      });
    }

    return parsed;
  } catch (error) {
    if (error instanceof AIError) throw error;
    throw new AIError(`Failed to parse JSON response: ${error.message}`, {
      response,
    });
  }
}

/**
 * Validate response against basic schema
 * Simple validation - checks required fields exist
 * 
 * @param {Object} response - Object to validate
 * @param {Object} schema - Schema with required fields
 * @returns {boolean} True if valid
 */
function validateSchema(response, schema) {
  if (!schema.required) return true;
  return schema.required.every((field) => field in response);
}

/**
 * Utility: Sleep for specified milliseconds
 * Used for retry backoff
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Custom error class for AI-related errors
 * Provides context for debugging and error handling
 */
export class AIError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'AIError';
    this.context = context;
  }
}

export { getOpenAIClient };

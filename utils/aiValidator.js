/**
 * AI Semantic Validator
 * Validates API responses using LLM-based semantic analysis
 * 
 * Purpose: Replace brittle exact-match assertions with intelligent semantic validation
 * Uses OpenAI or Anthropic Claude to understand if a response meets expected behavior
 * Provider is configurable via LLM_PROVIDER environment variable
 */

import { getLLMClient } from './llmFactory.js';
import {
  getSemanticValidationPrompt,
  getResponseComparisonPrompt,
  getFlakyTestAnalysisPrompt,
} from '../prompts/validationPrompts.js';

/**
 * Custom error class for validation errors
 */
export class AIError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'AIError';
    this.context = context;
  }
}

/**
 * Main validator class
 * Provides semantic validation interface for test assertions
 */
export class SemanticValidator {
  constructor(options = {}) {
    this.minValidationScore = options.minValidationScore || 75;
    this.cache = new Map(); // Simple cache for repeated validations
    this.validationHistory = []; // Track all validations
    this.client = getLLMClient(); // Initialize LLM client (OpenAI or Anthropic)
  }

  /**
   * Validate API response against expected behavior
   * Uses LLM to determine semantic equivalence rather than exact matching
   * 
   * @param {Object} response - The actual API response
   * @param {string} expectedBehavior - Description of expected response
   * @param {Object} options - Validation options
   * @param {Object} options.schema - Expected response schema
   * @param {number} options.minScore - Minimum validation score threshold
   * @param {string} options.testName - Name of the test (for logging)
   * 
   * @returns {Promise<ValidationResult>} Validation result with score and issues
   * @throws {AIError} If validation fails
   */
  async validateResponse(response, expectedBehavior, options = {}) {
    const { schema = null, minScore = this.minValidationScore, testName = 'Unknown' } = options;

    try {
      // Check cache first (if responses are deterministic)
      const cacheKey = this._getCacheKey(response, expectedBehavior);
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Build validation prompt
      const prompt = getSemanticValidationPrompt(response, expectedBehavior, schema);

      // Get LLM validation result using configured provider
      const validationResult = await this.client.getJSONCompletion(prompt, {
        required: ['isValid', 'validationScore', 'issues'],
      });

      // Enhance result with metadata
      const result = {
        ...validationResult,
        isValid:
          validationResult.isValid && validationResult.validationScore >= minScore,
        testName,
        timestamp: new Date().toISOString(),
      };

      // Cache and track the result
      this.cache.set(cacheKey, result);
      this.validationHistory.push(result);

      // Return failure if score is below threshold
      if (!result.isValid) {
        const error = new AIError(
          `Validation failed for ${testName}: score ${result.validationScore}/${100}`,
          {
            validationResult: result,
            expectedBehavior,
            actualResponse: response,
          }
        );
        error.validationResult = result;
        throw error;
      }

      return result;
    } catch (error) {
      // Log validation failure
      console.error(`Validation failed for test "${testName}":`, {
        expectedBehavior,
        response,
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Compare two responses for semantic equivalence
   * Useful for flaky test detection or approving multiple valid response formats
   * 
   * @param {Object} response1 - Expected/reference response
   * @param {Object} response2 - Actual response to compare
   * @param {string} testScenario - Description of the scenario
   * 
   * @returns {Promise<ComparisonResult>} Comparison analysis
   */
  async compareResponses(response1, response2, testScenario = 'Response comparison') {
    try {
      const prompt = getResponseComparisonPrompt(response1, response2, testScenario);

      const result = await this.client.getJSONCompletion(prompt, {
        required: ['areEquivalent', 'equivalenceScore'],
      });

      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Response comparison failed:', error.message);
      throw error;
    }
  }

  /**
   * Analyze test execution history for flakiness
   * Identifies patterns and potential root causes
   * 
   * @param {Array<TestRun>} executionHistory - Array of test runs
   * @param {string} testName - Name of the test
   * 
   * @returns {Promise<FlakinessAnalysis>} Flakiness analysis with recommendations
   */
  async analyzeFlakiness(executionHistory, testName) {
    try {
      if (!executionHistory || executionHistory.length < 2) {
        return {
          testName,
          isFlaky: false,
          message: 'Insufficient runs for flakiness analysis (minimum 2 required)',
        };
      }

      const prompt = getFlakyTestAnalysisPrompt(executionHistory, testName);

      const result = await this.client.getJSONCompletion(prompt, {
        required: ['failureRate', 'isFlaky', 'flakinessConfidence'],
      });

      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Flakiness analysis failed for ${testName}:`, error.message);
      throw error;
    }
  }

  /**
   * Batch validate multiple responses efficiently
   * Useful for validating multiple assertions in a single test
   * 
   * @param {Array} validations - Array of {response, expectedBehavior, options}
   * 
   * @returns {Promise<Array<ValidationResult>>} Validation results
   */
  async batchValidate(validations) {
    try {
      const results = await Promise.all(
        validations.map((validation) =>
          this.validateResponse(
            validation.response,
            validation.expectedBehavior,
            validation.options
          )
        )
      );

      return results;
    } catch (error) {
      console.error('Batch validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get validation history for reporting/analysis
   * 
   * @param {Object} filter - Filter options
   * @param {string} filter.testName - Filter by test name
   * @param {boolean} filter.failuresOnly - Only return failed validations
   * 
   * @returns {Array} Filtered validation history
   */
  getHistory(filter = {}) {
    let history = [...this.validationHistory];

    if (filter.testName) {
      history = history.filter((v) => v.testName === filter.testName);
    }

    if (filter.failuresOnly) {
      history = history.filter((v) => !v.isValid);
    }

    return history;
  }

  /**
   * Clear validation cache
   * Useful for resetting state between test suites
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Generate simple cache key from response and behavior
   * @private
   */
  _getCacheKey(response, expectedBehavior) {
    const hash = JSON.stringify([response, expectedBehavior]).length;
    return `${expectedBehavior}-${hash}`;
  }
}

/**
 * Validation Result Structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether response passed validation
 * @property {number} validationScore - 0-100 validation score
 * @property {string[]} issues - List of validation issues
 * @property {string[]} suggestions - Recommendations for fixes
 * @property {string} testName - Name of the test
 * @property {string} timestamp - When validation was performed
 */

/**
 * Comparison Result Structure
 * @typedef {Object} ComparisonResult
 * @property {boolean} areEquivalent - Whether responses are semantically equivalent
 * @property {number} equivalenceScore - 0-100 equivalence score
 * @property {Object} differences - Structural and value differences
 * @property {string} reasoning - Explanation of comparison result
 */

/**
 * Flakiness Analysis Result
 * @typedef {Object} FlakinessAnalysis
 * @property {string} testName - The test analyzed
 * @property {number} failureRate - Percentage of failed runs (0-1)
 * @property {boolean} isFlaky - Whether test is considered flaky
 * @property {number} flakinessConfidence - Confidence score (0-100)
 * @property {string[]} patterns - Identified failure patterns
 * @property {string[]} potentialCauses - Root cause hypotheses
 * @property {string[]} recommendations - How to fix the flakiness
 */

export default SemanticValidator;

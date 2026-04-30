/**
 * ARCHITECTURE GUIDE
 * 
 * This document explains how all components work together
 * to create a production-ready AI-powered test automation framework
 */

/**
 * ============================================================================
 * 1. COMPONENT DIAGRAM
 * ============================================================================
 * 
 *                         ┌─────────────────────┐
 *                         │   Test Suite        │
 *                         │ (ai-validation.     │
 *                         │  test.js)           │
 *                         └──────────┬──────────┘
 *                                    │
 *                    ┌───────────────┼───────────────┐
 *                    │               │               │
 *          ┌─────────▼────────┐  ┌──▼──────────┐  ┌─▼──────────────┐
 *          │  Semantic        │  │  API        │  │  OpenAI        │
 *          │  Validator       │  │  Service    │  │  Client        │
 *          │ (aiValidator.js) │  │ (apiService │  │(openaiClient   │
 *          └─────────┬────────┘  │  .js)       │  │ .js)           │
 *                    │           └──┬──────────┘  └────┬───────────┘
 *                    │              │                  │
 *          ┌─────────▼────────┐     │         ┌────────▼────────┐
 *          │  Prompt          │     │         │  OpenAI API     │
 *          │  Templates       │     │         │  (Remote)       │
 *          │(validationPrompts│     │         └─────────────────┘
 *          │ .js)             │     │
 *          └──────────────────┘     │
 *                                   │
 *                          ┌────────▼────────┐
 *                          │  External APIs  │
 *                          │  (jsonplaceholder│
 *                          │  , your APIs)   │
 *                          └─────────────────┘
 * 
 * ============================================================================
 * 2. DATA FLOW
 * ============================================================================
 * 
 * TEST EXECUTION FLOW:
 * 
 * 1. Test Suite Initialize
 *    ├─ Create APIService instance
 *    ├─ Create SemanticValidator instance
 *    └─ Load configuration
 * 
 * 2. Make API Request
 *    ├─ Test calls: apiService.get('/posts/1')
 *    ├─ APIService builds request config
 *    ├─ Sends HTTP request with timeout
 *    ├─ Handles retries on transient failures
 *    └─ Returns response data
 * 
 * 3. Semantic Validation
 *    ├─ Test calls: validator.validateResponse(response, expectedBehavior)
 *    ├─ Validator builds prompt from template
 *    ├─ Sends prompt to OpenAI Client
 *    ├─ OpenAI Client:
 *    │  ├─ Makes API call to OpenAI
 *    │  ├─ Handles rate limits (429 errors)
 *    │  ├─ Implements exponential backoff retry
 *    │  └─ Returns LLM validation result
 *    ├─ Validator parses JSON response
 *    ├─ Caches result for future use
 *    └─ Returns ValidationResult with score
 * 
 * 4. Assertion & Reporting
 *    ├─ Test checks: result.isValid
 *    ├─ Logs pass/fail with score
 *    └─ Adds to test results aggregator
 * 
 * ============================================================================
 * 3. MODULE RESPONSIBILITIES
 * ============================================================================
 * 
 * CONFIG (config/index.js)
 * ├─ Responsibility: Centralize all configuration
 * ├─ Sourced from: Environment variables (.env file)
 * ├─ Validated: On module load
 * ├─ Used by: All other modules
 * └─ Example: const apiUrl = config.api.baseUrl
 * 
 * OPENAI CLIENT (utils/openaiClient.js)
 * ├─ Responsibility: Communicate with OpenAI API
 * ├─ Features:
 * │  ├─ Singleton instance management
 * │  ├─ Automatic retry with exponential backoff
 * │  ├─ Rate limit handling
 * │  ├─ Error logging and context
 * │  └─ JSON response parsing
 * ├─ Public Methods:
 * │  ├─ getCompletion(message, options)
 * │  └─ getJSONCompletion(prompt, schema)
 * └─ Error: Throws AIError with context
 * 
 * PROMPT TEMPLATES (prompts/validationPrompts.js)
 * ├─ Responsibility: Generate prompts for LLM
 * ├─ Types:
 * │  ├─ Semantic validation prompts
 * │  ├─ Test case generation prompts
 * │  ├─ Flakiness analysis prompts
 * │  └─ Response comparison prompts
 * ├─ Benefits:
 * │  ├─ DRY - reusable across tests
 * │  ├─ Maintainable - centralized
 * │  └─ Versionable - easy to iterate
 * └─ Pattern: Function(data) => string
 * 
 * SEMANTIC VALIDATOR (utils/aiValidator.js)
 * ├─ Responsibility: Validate responses using AI
 * ├─ Core Method:
 * │  └─ async validateResponse(response, expectedBehavior, options)
 * │     ├─ Input: Actual response from API
 * │     ├─ Input: Description of expected behavior
 * │     ├─ Process:
 * │     │  ├─ Build prompt
 * │     │  ├─ Get LLM validation
 * │     │  ├─ Parse result
 * │     │  ├─ Cache for reuse
 * │     │  └─ Return ValidationResult
 * │     └─ Output: {isValid, validationScore, issues, suggestions}
 * ├─ Additional Methods:
 * │  ├─ compareResponses(r1, r2, scenario)
 * │  ├─ analyzeFlakiness(history, testName)
 * │  └─ batchValidate(validations)
 * └─ Caching: Simple Map-based cache
 * 
 * API SERVICE (services/apiService.js)
 * ├─ Responsibility: Reliable HTTP communication
 * ├─ Features:
 * │  ├─ Retry logic with exponential backoff
 * │  ├─ Timeout handling
 * │  ├─ Request/response logging
 * │  ├─ Rate limit awareness
 * │  ├─ Smart error classification
 * │  └─ Request history tracking
 * ├─ HTTP Methods: GET, POST, PUT, PATCH, DELETE
 * ├─ Retryable Errors:
 * │  ├─ 5xx Server errors
 * │  ├─ 429 Rate limit
 * │  └─ Timeouts
 * └─ Non-Retryable: 4xx Client errors
 * 
 * TEST SUITE (tests/ai-validation.test.js)
 * ├─ Responsibility: Demonstrate framework usage
 * ├─ Contains 4 test examples:
 * │  ├─ Test 1: Validate successful response
 * │  ├─ Test 2: Validate with schema
 * │  ├─ Test 3: Error handling
 * │  └─ Test 4: Batch validation
 * └─ Produces: Comprehensive test report
 * 
 * ============================================================================
 * 4. DESIGN PATTERNS USED
 * ============================================================================
 * 
 * SINGLETON PATTERN (OpenAI Client)
 * ├─ Problem: Avoid multiple SDK instances
 * ├─ Solution: getOpenAIClient() returns same instance
 * └─ Benefit: Resource efficient, shared configuration
 * 
 * DEPENDENCY INJECTION
 * ├─ All services accept options in constructor
 * ├─ Example: APIService({ baseUrl, timeout })
 * └─ Benefit: Testable, configurable, loose coupling
 * 
 * COMPOSITE PATTERN (Prompt Templates)
 * ├─ Prompts built from smaller functions
 * ├─ Example: getSemanticValidationPrompt(response, behavior)
 * └─ Benefit: Reusable, maintainable, DRY
 * 
 * FACADE PATTERN (SemanticValidator)
 * ├─ Hides complexity of LLM prompting
 * ├─ Simple interface: validateResponse()
 * └─ Benefit: Easy to use, abstracts complexity
 * 
 * ASYNC/AWAIT PATTERN
 * ├─ Used throughout for non-blocking I/O
 * ├─ Enables efficient concurrent operations
 * └─ Benefit: Better performance, cleaner code
 * 
 * ============================================================================
 * 5. ERROR HANDLING STRATEGY
 * ============================================================================
 * 
 * CUSTOM ERROR CLASSES:
 * 
 * AIError (utils/openaiClient.js)
 * ├─ Thrown by: OpenAI client
 * ├─ Contains: message, context, originalError
 * └─ Handle: Try/catch with error.context inspection
 * 
 * APIServiceError (services/apiService.js)
 * ├─ Thrown by: API service
 * ├─ Contains: message, statusCode, response, request
 * └─ Handle: Check error.statusCode for specific handling
 * 
 * ERROR FLOW:
 * 
 * 1. Retryable Errors (handled transparently)
 *    ├─ 429 Rate Limit → Exponential backoff retry
 *    ├─ 5xx Server Error → Retry with backoff
 *    └─ Timeout → Retry with backoff
 * 
 * 2. Non-Retryable Errors (fail immediately)
 *    ├─ 400 Bad Request → Invalid input, fail
 *    ├─ 403 Forbidden → Auth issue, fail
 *    └─ 404 Not Found → Resource missing, fail
 * 
 * 3. Validation Errors (captured in result)
 *    ├─ Low score → isValid = false
 *    ├─ Issues captured → result.issues array
 *    └─ Suggestions provided → result.suggestions
 * 
 * ============================================================================
 * 6. CACHING STRATEGY
 * ============================================================================
 * 
 * VALIDATION CACHE:
 * ├─ Type: Simple Map-based cache
 * ├─ Key: Hash of (response + expectedBehavior)
 * ├─ Value: Complete ValidationResult
 * ├─ Benefit: Reduces API calls for repeated validations
 * ├─ Limitation: Only works for identical inputs
 * └─ Manual: validator.clearCache() to reset
 * 
 * REQUEST HISTORY:
 * ├─ Type: Array of request logs
 * ├─ Tracked: All HTTP requests made
 * ├─ Use Cases:
 * │  ├─ Debugging failed requests
 * │  ├─ Performance analysis
 * │  └─ Audit trail
 * └─ Access: apiService.getRequestHistory()
 * 
 * VALIDATION HISTORY:
 * ├─ Type: Array of validation results
 * ├─ Tracked: All validations performed
 * ├─ Use Cases:
 * │  ├─ Test analysis
 * │  ├─ Pattern detection
 * │  └─ Flakiness determination
 * └─ Access: validator.getHistory()
 * 
 * ============================================================================
 * 7. CONFIGURATION FLOW
 * ============================================================================
 * 
 * STARTUP SEQUENCE:
 * 
 * 1. Application Start
 *    └─ import config from 'config/index.js'
 * 
 * 2. Config Module Loads
 *    ├─ dotenv.config() loads .env file
 *    ├─ Reads environment variables
 *    ├─ Builds config object
 *    ├─ Validates required fields
 *    └─ Throws error if invalid
 * 
 * 3. Modules Initialize
 *    ├─ APIService uses: config.api.*
 *    ├─ OpenAI Client uses: config.openai.*
 *    └─ Test uses: config.test.*
 * 
 * ENVIRONMENT VARIABLES (.env):
 * ├─ OPENAI_API_KEY (required)
 * ├─ OPENAI_MODEL (default: gpt-4-turbo)
 * ├─ OPENAI_TEMPERATURE (default: 0.3)
 * ├─ API_BASE_URL (required)
 * ├─ API_TIMEOUT (default: 30000)
 * ├─ MAX_RETRIES (default: 3)
 * ├─ FLAKY_TEST_THRESHOLD (default: 0.3)
 * └─ LOG_LEVEL (default: info)
 * 
 * ============================================================================
 * 8. EXTENSION POINTS
 * ============================================================================
 * 
 * ADD CUSTOM VALIDATION:
 * 
 *   class CustomValidator extends SemanticValidator {
 *     async validatePerformance(response, maxDuration) {
 *       // Custom validation logic
 *     }
 *   }
 * 
 * ADD NEW PROMPTS:
 * 
 *   // prompts/customPrompts.js
 *   export function getCustomPrompt(data) {
 *     return `Your prompt with ${data.field}`;
 *   }
 * 
 * ADD NEW API SERVICE METHODS:
 * 
 *   apiService.custom = async (endpoint) => {
 *     // Custom HTTP logic
 *   };
 * 
 * ============================================================================
 * 9. PRODUCTION CONSIDERATIONS
 * ============================================================================
 * 
 * SECURITY:
 * ├─ Never commit .env files
 * ├─ Use environment variables for secrets
 * ├─ Rotate API keys regularly
 * ├─ Log only non-sensitive data
 * └─ Validate all external inputs
 * 
 * PERFORMANCE:
 * ├─ Reuse validator instances
 * ├─ Enable caching for repeated validations
 * ├─ Monitor LLM API costs
 * ├─ Implement request batching
 * └─ Set appropriate timeouts
 * 
 * RELIABILITY:
 * ├─ Use exponential backoff retry
 * ├─ Handle transient failures gracefully
 * ├─ Log all errors with context
 * ├─ Track request history
 * └─ Implement circuit breaker pattern
 * 
 * MAINTAINABILITY:
 * ├─ Add comprehensive JSDoc comments
 * ├─ Keep modules focused and small
 * ├─ Use consistent coding style
 * ├─ Write meaningful error messages
 * └─ Version API contracts
 * 
 * ============================================================================
 * 10. TYPICAL USAGE PATTERN
 * ============================================================================
 * 
 * // 1. Import dependencies
 * import SemanticValidator from './utils/aiValidator.js';
 * import APIService from './services/apiService.js';
 * 
 * // 2. Initialize services
 * const validator = new SemanticValidator({ minValidationScore: 75 });
 * const api = new APIService();
 * 
 * // 3. Make API request
 * const response = await api.get('/users/1');
 * 
 * // 4. Validate semantically
 * await validator.validateResponse(
 *   response,
 *   'Response should be a valid user with id, name, and email',
 *   { testName: 'Get User' }
 * );
 * 
 * // 5. If validation fails, it throws AIError
 * // If validation passes, test continues
 * 
 * ============================================================================
 * 
 * ARCHITECTURE PRINCIPLES:
 * 
 * ✓ Single Responsibility: Each module has one reason to change
 * ✓ Open/Closed: Open for extension, closed for modification
 * ✓ Dependency Inversion: Depend on abstractions, not concretions
 * ✓ DRY (Don't Repeat Yourself): Logic is reusable and centralized
 * ✓ KISS (Keep It Simple Stupid): Clear, understandable code
 * ✓ YAGNI (You Ain't Gonna Need It): No premature optimization
 * 
 * ============================================================================
 */

export const architectureGuide = `
AI-Powered Test Automation Framework - Architecture Guide
See inline comments in this file for detailed explanations.
`;

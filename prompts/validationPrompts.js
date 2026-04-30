/**
 * Prompt Templates for AI Validation
 * Centralizes all LLM prompts to maintain consistency and enable version control
 * 
 * Purpose: Keep prompts DRY, reusable, and easy to iterate on
 * These are templates that get filled with actual test data
 */

/**
 * Prompt for semantic validation of API responses
 * Validates response structure and content without exact matching
 * 
 * @param {Object} response - The API response to validate
 * @param {string} expectedBehavior - Description of what the response should contain
 * @param {Object} schema - Expected schema structure
 * 
 * @returns {string} Formatted prompt for LLM
 */
export function getSemanticValidationPrompt(
  response,
  expectedBehavior,
  schema = null
) {
  return `You are a test validation expert. Analyze the following API response and determine if it meets the expected behavior.

EXPECTED BEHAVIOR:
${expectedBehavior}

ACTUAL RESPONSE:
${JSON.stringify(response, null, 2)}

${
  schema
    ? `\nEXPECTED STRUCTURE:\n${JSON.stringify(schema, null, 2)}`
    : ''
}

Evaluate:
1. Does the response structure match expectations?
2. Does the response content semantically align with expected behavior?
3. Are there any missing or unexpected fields?
4. Is the data type and format correct?

Respond in JSON format with:
{
  "isValid": boolean,
  "validationScore": number (0-100),
  "issues": string[],
  "suggestions": string[]
}`;
}

/**
 * Prompt for test case generation
 * Generates comprehensive test cases for a given API endpoint
 * 
 * @param {string} apiEndpoint - The API endpoint to test
 * @param {string} apiDescription - Description of what the endpoint does
 * @param {Object} requestSchema - Request parameter schema
 * 
 * @returns {string} Formatted prompt for LLM
 */
export function getTestCaseGenerationPrompt(
  apiEndpoint,
  apiDescription,
  requestSchema = null
) {
  return `You are an expert SDET. Generate comprehensive test cases for the following API endpoint.

API ENDPOINT: ${apiEndpoint}
DESCRIPTION: ${apiDescription}

${
  requestSchema
    ? `REQUEST SCHEMA:\n${JSON.stringify(requestSchema, null, 2)}`
    : ''
}

Generate test cases covering:
1. Happy path (valid inputs)
2. Edge cases (boundary values, empty data)
3. Error cases (invalid inputs, missing required fields)
4. Performance considerations (large payloads, concurrent requests)
5. Security considerations (injection attacks, unauthorized access)

For each test case, provide:
- testName: descriptive name
- description: what the test validates
- requestData: sample input
- expectedResponses: what success/failure should look like
- assertionType: semantic validation points

Respond in JSON format:
{
  "testCases": [
    {
      "testName": string,
      "description": string,
      "category": string,
      "requestData": object,
      "expectedBehavior": string,
      "priority": "critical" | "high" | "medium" | "low"
    }
  ]
}`;
}

/**
 * Prompt for flaky test analysis
 * Analyzes test execution history to identify flaky patterns
 * 
 * @param {Array} executionHistory - Array of test run results
 * @param {string} testName - Name of the test being analyzed
 * 
 * @returns {string} Formatted prompt for LLM
 */
export function getFlakyTestAnalysisPrompt(executionHistory, testName) {
  return `You are a test reliability expert. Analyze the following test execution history to identify flakiness patterns.

TEST NAME: ${testName}

EXECUTION HISTORY:
${JSON.stringify(executionHistory, null, 2)}

Analyze:
1. What is the failure rate?
2. Are there patterns in when failures occur?
3. What could be the root causes? (timing, external dependencies, environment, data)
4. Which runs appear to be outliers?
5. Confidence that this test is flaky (0-100%)

Respond in JSON format:
{
  "testName": string,
  "failureRate": number (0-1),
  "isFlaky": boolean,
  "flakinessConfidence": number (0-100),
  "patterns": string[],
  "potentialCauses": string[],
  "recommendations": string[],
  "outlierRuns": number[]
}`;
}

/**
 * Prompt for response comparison and correlation
 * Determines if two responses are semantically equivalent
 * 
 * @param {Object} response1 - First response to compare
 * @param {Object} response2 - Second response to compare
 * @param {string} testScenario - Description of the test scenario
 * 
 * @returns {string} Formatted prompt for LLM
 */
export function getResponseComparisonPrompt(response1, response2, testScenario) {
  return `You are a test assertion expert. Determine if these two API responses are semantically equivalent.

TEST SCENARIO: ${testScenario}

RESPONSE 1:
${JSON.stringify(response1, null, 2)}

RESPONSE 2:
${JSON.stringify(response2, null, 2)}

Compare:
1. Do they represent the same data?
2. Are structural differences acceptable?
3. Are value differences acceptable?
4. What are the key differences?

Respond in JSON format:
{
  "areEquivalent": boolean,
  "equivalenceScore": number (0-100),
  "differences": {
    "structural": string[],
    "values": string[],
    "acceptable": string[]
  },
  "reasoning": string
}`;
}

export default {
  getSemanticValidationPrompt,
  getTestCaseGenerationPrompt,
  getFlakyTestAnalysisPrompt,
  getResponseComparisonPrompt,
};

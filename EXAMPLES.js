/**
 * USAGE EXAMPLES
 * 
 * Real-world examples of how to use the AI-powered test automation framework
 * Copy and modify these patterns for your own tests
 */

/**
 * ============================================================================
 * EXAMPLE 1: BASIC API RESPONSE VALIDATION
 * ============================================================================
 */

import SemanticValidator from './utils/aiValidator.js';
import APIService from './services/apiService.js';

async function exampleBasicValidation() {
  // Initialize services
  const validator = new SemanticValidator({ minValidationScore: 75 });
  const apiService = new APIService({ baseUrl: 'https://jsonplaceholder.typicode.com' });

  try {
    // Fetch data from API
    const postData = await apiService.get('/posts/1');

    // Validate the response
    const result = await validator.validateResponse(
      postData,
      `
        The response should be a valid blog post containing:
        - A unique ID (number)
        - User ID (number)  
        - A meaningful title (non-empty string)
        - Substantial body content (non-empty string)
      `,
      { testName: 'Get Post by ID' }
    );

    // Handle result
    if (result.isValid) {
      console.log(`✓ Validation passed with score: ${result.validationScore}/100`);
    } else {
      console.log(`✗ Validation failed: ${result.issues.join(', ')}`);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

/**
 * ============================================================================
 * EXAMPLE 2: BATCH VALIDATION OF MULTIPLE ASSERTIONS
 * ============================================================================
 * 
 * When you have multiple assertions about the same response,
 * batch them for efficiency (single LLM call for related validations)
 */

async function exampleBatchValidation() {
  const validator = new SemanticValidator();
  const apiService = new APIService({ baseUrl: 'https://jsonplaceholder.typicode.com' });

  try {
    // Fetch user data
    const userData = await apiService.get('/users/1');

    // Define multiple validations
    const validations = [
      {
        response: userData,
        expectedBehavior: 'User has a valid email format with @ symbol',
        options: { testName: 'Email Format' },
      },
      {
        response: userData,
        expectedBehavior: 'User has a unique ID greater than 0',
        options: { testName: 'ID Validation' },
      },
      {
        response: userData,
        expectedBehavior: 'User has a non-empty name field',
        options: { testName: 'Name Required' },
      },
    ];

    // Perform batch validation (more efficient)
    const results = await validator.batchValidate(validations);

    // Check results
    const allPassed = results.every((r) => r.isValid);
    const avgScore = results.reduce((sum, r) => sum + r.validationScore, 0) / results.length;

    console.log(`Batch Results: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
    console.log(`Average Score: ${avgScore.toFixed(0)}/100`);

    results.forEach((result) => {
      const status = result.isValid ? '✓' : '✗';
      console.log(`  ${status} ${result.testName}: ${result.validationScore}/100`);
    });
  } catch (error) {
    console.error('Batch validation failed:', error.message);
  }
}

/**
 * ============================================================================
 * EXAMPLE 3: FLAKY TEST DETECTION
 * ============================================================================
 * 
 * Run a test multiple times and analyze results to detect flakiness
 * Useful for identifying unreliable tests
 */

async function exampleFlakyTestDetection() {
  const validator = new SemanticValidator();
  const apiService = new APIService({ baseUrl: 'https://jsonplaceholder.typicode.com' });

  try {
    // Simulate multiple test runs
    const executionHistory = [];

    // Run test 5 times
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      try {
        const data = await apiService.get('/posts/1');
        // Simulate sometimes slow responses
        const duration = Math.random() > 0.7 ? 2000 : 100;
        await new Promise((resolve) => setTimeout(resolve, duration));

        executionHistory.push({
          run: i + 1,
          status: 'PASS',
          duration,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        executionHistory.push({
          run: i + 1,
          status: 'FAIL',
          error: error.message,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Analyze flakiness
    const analysis = await validator.analyzeFlakiness(executionHistory, 'test_api_response');

    console.log('\nFlakiness Analysis:');
    console.log(`  Test: ${analysis.testName}`);
    console.log(`  Failure Rate: ${(analysis.failureRate * 100).toFixed(1)}%`);
    console.log(`  Is Flaky: ${analysis.isFlaky ? 'Yes' : 'No'}`);
    console.log(`  Confidence: ${analysis.flakinessConfidence}%`);

    if (analysis.potentialCauses) {
      console.log('\nPotential Causes:');
      analysis.potentialCauses.forEach((cause) => console.log(`  - ${cause}`));
    }

    if (analysis.recommendations) {
      console.log('\nRecommendations:');
      analysis.recommendations.forEach((rec) => console.log(`  - ${rec}`));
    }
  } catch (error) {
    console.error('Flakiness analysis failed:', error.message);
  }
}

/**
 * ============================================================================
 * EXAMPLE 4: RESPONSE COMPARISON (SEMANTIC EQUIVALENCE)
 * ============================================================================
 * 
 * Compare two responses to determine if they're semantically equivalent
 * Useful for comparing different API versions or formats
 */

async function exampleResponseComparison() {
  const validator = new SemanticValidator();
  const apiService = new APIService({ baseUrl: 'https://jsonplaceholder.typicode.com' });

  try {
    // Get two similar responses
    const response1 = await apiService.get('/posts/1');
    const response2 = await apiService.get('/posts/2');

    // Compare them
    const comparison = await validator.compareResponses(
      response1,
      response2,
      'Both are blog posts from the same API'
    );

    console.log('\nResponse Comparison:');
    console.log(`  Are Equivalent: ${comparison.areEquivalent}`);
    console.log(`  Equivalence Score: ${comparison.equivalenceScore}/100`);
    console.log(`  Reasoning: ${comparison.reasoning}`);

    if (comparison.differences) {
      if (comparison.differences.structural?.length > 0) {
        console.log('\nStructural Differences:');
        comparison.differences.structural.forEach((diff) => console.log(`  - ${diff}`));
      }
      if (comparison.differences.values?.length > 0) {
        console.log('\nValue Differences:');
        comparison.differences.values.forEach((diff) => console.log(`  - ${diff}`));
      }
    }
  } catch (error) {
    console.error('Response comparison failed:', error.message);
  }
}

/**
 * ============================================================================
 * EXAMPLE 5: ERROR HANDLING AND LOGGING
 * ============================================================================
 * 
 * Demonstrate proper error handling and debugging techniques
 */

async function exampleErrorHandling() {
  const validator = new SemanticValidator();
  const apiService = new APIService({ baseUrl: 'https://jsonplaceholder.typicode.com' });

  try {
    // Try to access non-existent resource
    const response = await apiService.get('/posts/99999');

    console.log('Response:', response);
  } catch (error) {
    console.log('\nError Handling Demo:');
    console.log(`  Error Type: ${error.name}`);
    console.log(`  Status Code: ${error.statusCode}`);
    console.log(`  Message: ${error.message}`);

    if (error.statusCode === 404) {
      console.log('  → Resource not found');
    } else if (error.statusCode >= 500) {
      console.log('  → Server error (would be retried automatically)');
    }

    // View request history
    const history = apiService.getRequestHistory({ errorsOnly: true });
    console.log(`\nRequest History (errors only): ${history.length} failed requests`);
    history.slice(-3).forEach((log) => {
      console.log(`  - ${log.method} ${log.endpoint} [${log.statusCode}]`);
    });
  }
}

/**
 * ============================================================================
 * EXAMPLE 6: CUSTOM VALIDATION LOGIC
 * ============================================================================
 * 
 * Extend the validator with custom validation methods
 */

class CustomValidator extends SemanticValidator {
  /**
   * Validate response time performance
   */
  async validateResponseTime(duration, maxDuration, testName = 'Response Time') {
    const result = {
      isValid: duration <= maxDuration,
      duration,
      maxDuration,
      testName,
      timestamp: new Date().toISOString(),
    };

    if (!result.isValid) {
      throw new Error(`Response took ${duration}ms, max allowed: ${maxDuration}ms`);
    }

    return result;
  }

  /**
   * Validate response contains required fields
   */
  async validateRequiredFields(response, requiredFields, testName = 'Required Fields') {
    const missingFields = requiredFields.filter((field) => !(field in response));

    const result = {
      isValid: missingFields.length === 0,
      missingFields,
      requiredFields,
      testName,
      timestamp: new Date().toISOString(),
    };

    if (!result.isValid) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return result;
  }
}

async function exampleCustomValidation() {
  const validator = new CustomValidator();
  const apiService = new APIService({ baseUrl: 'https://jsonplaceholder.typicode.com' });

  try {
    const startTime = Date.now();
    const response = await apiService.get('/posts/1');
    const duration = Date.now() - startTime;

    // Validate response time
    await validator.validateResponseTime(duration, 5000, 'API Response Time');
    console.log(`✓ Response time OK: ${duration}ms`);

    // Validate required fields
    await validator.validateRequiredFields(response, ['id', 'userId', 'title', 'body'], 'Post Fields');
    console.log('✓ All required fields present');
  } catch (error) {
    console.error('✗ Custom validation failed:', error.message);
  }
}

/**
 * ============================================================================
 * EXAMPLE 7: INTEGRATION TEST SCENARIO
 * ============================================================================
 * 
 * Complete test scenario with setup, multiple validations, and cleanup
 */

async function exampleIntegrationTest() {
  const validator = new SemanticValidator({ minValidationScore: 70 });
  const apiService = new APIService({ baseUrl: 'https://jsonplaceholder.typicode.com' });

  console.log('\n[SETUP] Initializing test environment...');
  const testResults = [];

  try {
    // Test 1: Fetch user data
    console.log('\n[TEST 1] Validate user details...');
    const user = await apiService.get('/users/1');

    const userValidation = await validator.validateResponse(
      user,
      'User should have name, email, phone, and company information',
      { testName: 'User Details' }
    );

    testResults.push({
      name: 'User Details',
      status: userValidation.isValid ? 'PASS' : 'FAIL',
      score: userValidation.validationScore,
    });

    // Test 2: Fetch user posts
    console.log('[TEST 2] Validate user posts...');
    const posts = await apiService.get('/posts?userId=1');

    const postsValidation = await validator.validateResponse(
      posts,
      'Should return an array of posts with title and body content',
      { testName: 'User Posts' }
    );

    testResults.push({
      name: 'User Posts',
      status: postsValidation.isValid ? 'PASS' : 'FAIL',
      score: postsValidation.validationScore,
    });

    // Test 3: Batch validation of post details
    console.log('[TEST 3] Validate first post...');
    const firstPost = posts[0];

    const postValidations = [
      {
        response: firstPost,
        expectedBehavior: 'Post should have numeric ID and userID',
        options: { testName: 'Post IDs' },
      },
      {
        response: firstPost,
        expectedBehavior: 'Post should have non-empty title',
        options: { testName: 'Post Title' },
      },
      {
        response: firstPost,
        expectedBehavior: 'Post should have substantial body content',
        options: { testName: 'Post Body' },
      },
    ];

    const batchResults = await validator.batchValidate(postValidations);
    batchResults.forEach((result) => {
      testResults.push({
        name: result.testName,
        status: result.isValid ? 'PASS' : 'FAIL',
        score: result.validationScore,
      });
    });

    // CLEANUP
    console.log('\n[CLEANUP] Generating report...');
    validator.clearCache();
    apiService.clearHistory();

    // REPORT
    console.log('\n═══════════════════════════════════════');
    console.log('TEST RESULTS');
    console.log('═══════════════════════════════════════');

    let passCount = 0;
    testResults.forEach((result) => {
      const icon = result.status === 'PASS' ? '✓' : '✗';
      const score = result.score ? ` [${result.score}/100]` : '';
      console.log(`  ${icon} ${result.name}${score}`);
      if (result.status === 'PASS') passCount++;
    });

    console.log('═══════════════════════════════════════');
    console.log(`Summary: ${passCount}/${testResults.length} tests passed`);
    console.log('═══════════════════════════════════════');
  } catch (error) {
    console.error('\n✗ Integration test failed:', error.message);
  }
}

/**
 * ============================================================================
 * RUN ALL EXAMPLES
 * ============================================================================
 */

async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      AI-POWERED TEST AUTOMATION FRAMEWORK - USAGE EXAMPLES      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // Un-comment the example you want to run, or run all

  // await exampleBasicValidation();
  // await exampleBatchValidation();
  // await exampleFlakyTestDetection();
  // await exampleResponseComparison();
  // await exampleErrorHandling();
  // await exampleCustomValidation();
  // await exampleIntegrationTest();

  console.log('\nAll example functions are defined above.');
  console.log('Un-comment the example you want to run in this file.\n');
}

// Export functions for use in other files
export {
  exampleBasicValidation,
  exampleBatchValidation,
  exampleFlakyTestDetection,
  exampleResponseComparison,
  exampleErrorHandling,
  exampleCustomValidation,
  exampleIntegrationTest,
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

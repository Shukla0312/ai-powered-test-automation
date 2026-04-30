/**
 * AI-Powered Semantic Validation Test
 * 
 * This test demonstrates the core framework capabilities:
 * 1. Making API requests with error handling
 * 2. Validating responses using AI semantic understanding
 * 3. Handling both passing and failing assertions
 * 4. Logging and reporting
 * 
 * Run with: node tests/ai-validation.test.js
 */

import SemanticValidator from '../utils/aiValidator.js';
import APIService from '../services/apiService.js';
import config from '../config/index.js';

/**
 * Test Suite: AI Semantic Validation
 */
class TestSuite {
  constructor() {
    this.validator = new SemanticValidator({
      minValidationScore: 75,
    });
    
    // Using JSONPlaceholder as a free test API
    this.apiService = new APIService({
      baseUrl: 'https://jsonplaceholder.typicode.com',
    });

    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
    };
  }

  /**
   * Test 1: Validate successful JSON response from public API
   * Tests basic semantic validation: Does the response look like a valid post?
   */
  async testValidateSuccessfulPostResponse() {
    const testName = 'Validate Post Response Structure';
    console.log(`\n📝 Running: ${testName}`);

    try {
      // Step 1: Fetch data from API
      const postData = await this.apiService.get('/posts/1');
      
      console.log('Response received:', JSON.stringify(postData, null, 2));

      // Step 2: Define expected behavior
      const expectedBehavior = `
        The response should be a valid blog post with:
        - An ID field (number)
        - A user ID field (number)
        - A title field (non-empty string) with actual content
        - A body field (non-empty string) with actual content
        - No sensitive or malformed data
      `;

      // Step 3: Perform semantic validation using AI
      const validationResult = await this.validator.validateResponse(
        postData,
        expectedBehavior,
        {
          minScore: 75,
          testName,
        }
      );

      // Step 4: Assert validation passed
      if (validationResult.isValid) {
        console.log(`✓ PASS - Validation Score: ${validationResult.validationScore}/100`);
        this.results.passed++;
      } else {
        console.log(`✗ FAIL - Validation Score: ${validationResult.validationScore}/100`);
        console.log('Issues:', validationResult.issues);
        this.results.failed++;
      }

      this.results.tests.push({
        name: testName,
        status: validationResult.isValid ? 'PASS' : 'FAIL',
        score: validationResult.validationScore,
      });

    } catch (error) {
      console.error(`✗ ERROR: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
      });
    }
  }

  /**
   * Test 2: Validate response with specific field requirements
   * Tests that API returns expected fields
   */
  async testValidateUserResponseStructure() {
    const testName = 'Validate User Response with Schema';
    console.log(`\n📝 Running: ${testName}`);

    try {
      const userData = await this.apiService.get('/users/1');
      
      console.log('Response received:', JSON.stringify(userData, null, 2));

      const expectedBehavior = `
        The response must contain:
        - A unique ID and name for the user
        - Contact information (email, phone)
        - Company/organization information
        - All fields should be properly formatted (no empty strings)
      `;

      const schema = {
        required: ['id', 'name', 'email', 'phone', 'company'],
      };

      const validationResult = await this.validator.validateResponse(
        userData,
        expectedBehavior,
        {
          schema,
          minScore: 70,
          testName,
        }
      );

      if (validationResult.isValid) {
        console.log(`✓ PASS - Validation Score: ${validationResult.validationScore}/100`);
        this.results.passed++;
      } else {
        console.log(`✗ FAIL - Validation Score: ${validationResult.validationScore}/100`);
        console.log('Issues:', validationResult.issues);
        this.results.failed++;
      }

      this.results.tests.push({
        name: testName,
        status: validationResult.isValid ? 'PASS' : 'FAIL',
        score: validationResult.validationScore,
      });

    } catch (error) {
      console.error(`✗ ERROR: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
      });
    }
  }

  /**
   * Test 3: Test API Service error handling
   * Validates that the API service properly handles invalid requests
   */
  async testAPIServiceErrorHandling() {
    const testName = 'API Service Error Handling';
    console.log(`\n📝 Running: ${testName}`);

    try {
      // Attempt to fetch non-existent resource
      try {
        await this.apiService.get('/posts/99999');
        console.log('✗ FAIL - Should have raised an error for non-existent resource');
        this.results.failed++;
      } catch (error) {
        if (error instanceof Error && error.message.includes('failed')) {
          console.log(
            `✓ PASS - Error handled correctly: ${error.statusCode}`
          );
          this.results.passed++;
        } else {
          throw error;
        }
      }

      this.results.tests.push({
        name: testName,
        status: 'PASS',
      });

    } catch (error) {
      console.error(`✗ ERROR: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
      });
    }
  }

  /**
   * Test 4: Batch validation of multiple responses
   * Demonstrates efficiency of validating multiple assertions
   */
  async testBatchValidation() {
    const testName = 'Batch Validation of Multiple Responses';
    console.log(`\n📝 Running: ${testName}`);

    try {
      // Fetch multiple resources
      const post1 = await this.apiService.get('/posts/1');
      const post2 = await this.apiService.get('/posts/2');

      // Define batch validations
      const validations = [
        {
          response: post1,
          expectedBehavior: 'Valid blog post with title and body',
          options: { testName: 'Post 1 Validation' },
        },
        {
          response: post2,
          expectedBehavior: 'Valid blog post with title and body',
          options: { testName: 'Post 2 Validation' },
        },
      ];

      // Perform batch validation
      const results = await this.validator.batchValidate(validations);

      // Check results
      const allPassed = results.every((r) => r.isValid);
      console.log(
        `Batch Results: ${results.length} validations, ` +
        `Avg Score: ${(results.reduce((sum, r) => sum + r.validationScore, 0) / results.length).toFixed(0)}/100`
      );

      if (allPassed) {
        console.log(`✓ PASS - All batch validations passed`);
        this.results.passed++;
      } else {
        console.log(`✗ FAIL - Some batch validations failed`);
        this.results.failed++;
      }

      this.results.tests.push({
        name: testName,
        status: allPassed ? 'PASS' : 'FAIL',
      });

    } catch (error) {
      console.error(`✗ ERROR: ${error.message}`);
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'ERROR',
        error: error.message,
      });
    }
  }

  /**
   * Run all tests and generate report
   */
  async runAll() {
    const activeProvider = config.llm.provider;
    const activeModel =
      activeProvider === 'anthropic' ? config.anthropic.model : config.openai.model;

    console.log('═'.repeat(70));
    console.log('🤖 AI-Powered Test Automation Framework');
    console.log('═'.repeat(70));
    console.log(
      `Configuration: Provider=${activeProvider}, Model=${activeModel}, ` +
      `BaseURL=${config.api.baseUrl}`
    );
    console.log('═'.repeat(70));

    // Run all tests
    await this.testValidateSuccessfulPostResponse();
    await this.testValidateUserResponseStructure();
    await this.testAPIServiceErrorHandling();
    await this.testBatchValidation();

    // Print report
    this.printReport();
  }

  /**
   * Print test execution report
   */
  printReport() {
    const { passed, failed, skipped } = this.results;
    const total = passed + failed + skipped;

    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST REPORT');
    console.log('═'.repeat(70));
    console.log(`Total Tests: ${total}`);
    console.log(`✓ Passed: ${passed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`⊘ Skipped: ${skipped}`);

    console.log('\nTest Details:');
    this.results.tests.forEach((test) => {
      const icon = test.status === 'PASS' ? '✓' : test.status === 'FAIL' ? '✗' : '⚠';
      const score = test.score ? ` [${test.score}/100]` : '';
      console.log(`  ${icon} ${test.name}${score}`);
      if (test.error) console.log(`    Error: ${test.error}`);
    });

    console.log('\n' + '═'.repeat(70));
    console.log(
      passed === total
        ? '✓ All tests passed!'
        : `${failed} test(s) failed. Review errors above.`
    );
    console.log('═'.repeat(70));

    // Print useful debugging info
    console.log('\n📋 Framework Info:');
    console.log(`- API Requests: ${this.apiService.getRequestHistory().length}`);
    console.log(`- Validations Performed: ${this.validator.getHistory().length}`);
    console.log(
      `- Cache Size: ${this.validator.cache.size} entries`
    );

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const testSuite = new TestSuite();
    await testSuite.runAll();
  } catch (error) {
    console.error('Fatal Error:', error.message);
    process.exit(1);
  }
}

// Run tests
main();

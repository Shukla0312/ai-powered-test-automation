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

import { pathToFileURL } from 'url';
import SemanticValidator from '../utils/aiValidator.js';
import APIService from '../services/apiService.js';
import config from '../config/index.js';
import { logAIValidation, logStep, logSummary, logTestResult } from '../utils/logger.js';

/**
 * Test Suite: AI Semantic Validation
 */
export class TestSuite {
  constructor() {
    this.validator = new SemanticValidator({
      minValidationScore: 75,
    });
    
    this.apiService = new APIService({
      baseUrl: config.api.baseUrl,
      timeout: config.api.timeout,
      retryAttempts: config.api.retryAttempts,
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
    logStep(`Running: ${testName}`);

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
        logTestResult({
          status: 'PASS',
          score: validationResult.validationScore,
          reason: validationResult.reason,
        });
        this.results.passed++;
      } else {
        logTestResult({
          status: 'FAIL',
          score: validationResult.validationScore,
          reason: validationResult.reason,
        });
        console.log('Issues:', validationResult.issues);
        this.results.failed++;
      }

      this.results.tests.push({
        name: testName,
        status: validationResult.isValid ? 'PASS' : 'FAIL',
        score: validationResult.validationScore,
        reason: validationResult.reason,
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
    logStep(`Running: ${testName}`);

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
        logTestResult({
          status: 'PASS',
          score: validationResult.validationScore,
          reason: validationResult.reason,
        });
        this.results.passed++;
      } else {
        logTestResult({
          status: 'FAIL',
          score: validationResult.validationScore,
          reason: validationResult.reason,
        });
        console.log('Issues:', validationResult.issues);
        this.results.failed++;
      }

      this.results.tests.push({
        name: testName,
        status: validationResult.isValid ? 'PASS' : 'FAIL',
        score: validationResult.validationScore,
        reason: validationResult.reason,
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
    logStep(`Running: ${testName}`);

    try {
      // Attempt to fetch non-existent resource
      try {
        await this.apiService.get('/posts/99999', { expectedStatus: 404 });
        logTestResult({
          status: 'FAIL',
          reason: 'Should have raised an error for non-existent resource',
        });
        this.results.failed++;
      } catch (error) {
        if (error instanceof Error && error.message.includes('failed')) {
          logTestResult({
            status: 'PASS',
            reason: `Error handled correctly: ${error.statusCode}`,
          });
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
    logStep(`Running: ${testName}`);

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
        logTestResult({
          status: 'PASS',
          reason: 'All batch validations passed',
        });
        this.results.passed++;
      } else {
        logTestResult({
          status: 'FAIL',
          reason: 'Some batch validations failed',
        });
        this.results.failed++;
      }

      this.results.tests.push({
        name: testName,
        status: allPassed ? 'PASS' : 'FAIL',
        reason: allPassed
          ? 'All batch responses met semantic validation expectations'
          : 'One or more batch responses failed semantic validation',
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
   * Test 5: Real-world CRM onboarding scenario
   * Validates a user profile for a realistic business workflow and verifies
   * that a missing required contact field is rejected.
   */
  async testRealWorldUserOnboardingScenario() {
    const testName = 'Real-World User Onboarding Validation';
    logStep(`Running: ${testName}`);

    try {
      const userData = await this.apiService.get('/users/1');

      const expectedBehavior = `
        This user profile should be ready for CRM onboarding:
        - It must include identity details: id, name, username
        - It must include contact details: email and phone
        - It must include address details for regional routing
        - It must include company details for B2B account assignment
        - Values should be present, readable, and logically consistent
      `;

      const schema = {
        required: ['id', 'name', 'username', 'email', 'phone', 'address', 'company'],
      };

      const validResult = await this.validator.validateResponse(
        userData,
        expectedBehavior,
        {
          schema,
          minScore: 80,
          testName,
        }
      );

      const incompleteUser = { ...userData };
      delete incompleteUser.email;

      try {
        await this.validator.validateResponse(
          incompleteUser,
          expectedBehavior,
          {
            schema,
            minScore: 80,
            testName: `${testName} - Missing Email Edge Case`,
            suppressFailureLog: true,
          }
        );

        logTestResult({
          status: 'FAIL',
          reason: 'Missing email edge case should have failed',
        });
        this.results.failed++;
        this.results.tests.push({
          name: testName,
          status: 'FAIL',
          reason: 'Missing email edge case was not rejected',
        });
        return;
      } catch (error) {
        if (!error.validationResult) throw error;
        logAIValidation({
          status: 'PASS',
          reason: `Missing email edge case rejected: ${error.validationResult.reason}`,
        });
      }

      logTestResult({
        status: 'PASS',
        score: validResult.validationScore,
        reason: validResult.reason,
      });
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'PASS',
        score: validResult.validationScore,
        reason: 'Valid CRM profile accepted and missing-email edge case rejected',
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
    await this.testRealWorldUserOnboardingScenario();

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
      if (test.reason) console.log(`    Reason: ${test.reason}`);
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
    logSummary(`API Requests: ${this.apiService.getRequestHistory().length}`);
    logSummary(`Validations Performed: ${this.validator.getHistory().length}`);
    logSummary(`Cache Size: ${this.validator.cache.size} entries`);

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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

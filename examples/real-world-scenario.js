/**
 * Real-world scenario: customer profile contract validation.
 *
 * This example validates whether an external customer profile API returns
 * enough information for a CRM onboarding workflow.
 *
 * Run with:
 *   node examples/real-world-scenario.js
 */

import SemanticValidator from '../utils/aiValidator.js';
import APIService from '../services/apiService.js';
import config from '../config/index.js';

const apiService = new APIService({
  baseUrl: config.api.baseUrl,
  timeout: config.api.timeout,
  retryAttempts: config.api.retryAttempts,
});

const validator = new SemanticValidator({
  minValidationScore: 80,
});

async function validateCustomerOnboardingProfile() {
  const customer = await apiService.get('/users/1');

  const result = await validator.validateResponse(
    customer,
    `
      This customer profile should be ready for CRM onboarding:
      - It must include identity details such as id, name, and username.
      - It must include contact details such as email and phone.
      - It must include address details for regional assignment.
      - It must include company details for B2B account routing.
      - Values should be present, readable, and not malformed.
    `,
    {
      minScore: 80,
      testName: 'CRM Customer Onboarding Profile',
      schema: {
        required: ['id', 'name', 'username', 'email', 'phone', 'address', 'company'],
      },
    }
  );

  console.log('CRM onboarding validation passed');
  console.log(`Validation score: ${result.validationScore}/100`);
}

validateCustomerOnboardingProfile().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

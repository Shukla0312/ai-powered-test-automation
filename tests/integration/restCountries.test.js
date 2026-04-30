import assert from 'node:assert/strict';
import test from 'node:test';

import APIService from '../../services/apiService.js';
import SemanticValidator, { AIError } from '../../utils/aiValidator.js';
import { logAIValidation, logStep, logTestResult } from '../../utils/logger.js';

const api = new APIService({
  baseUrl: 'https://restcountries.com',
  timeout: 15000,
  retryAttempts: 2,
});

const validator = new SemanticValidator({
  minValidationScore: 80,
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function fetchIndiaCountry() {
  const response = await api.get('/v3.1/name/india');
  if (!Array.isArray(response) || response.length === 0) {
    throw new Error('RestCountries response is empty or invalid');
  }
  return response[0];
}

async function expectPass({ testName, response, expectedBehavior, schema }) {
  logStep(`Running: ${testName}`);
  const result = await validator.validateResponse(response, expectedBehavior, {
    testName,
    minScore: 80,
    schema,
  });
  logAIValidation(result);
  logTestResult({
    status: result.status,
    score: result.validationScore,
    reason: result.reason,
  });
  assert.equal(result.status, 'PASS');
}

async function expectFail({ testName, response, expectedBehavior, schema }) {
  logStep(`Running: ${testName}`);
  try {
    const result = await validator.validateResponse(response, expectedBehavior, {
      testName,
      minScore: 80,
      schema,
    });
    logAIValidation(result);
    logTestResult({
      status: 'FAIL',
      reason: 'Expected FAIL but validation passed',
    });
    assert.fail(`${testName} expected FAIL but passed`);
  } catch (error) {
    if (!(error instanceof AIError) || !error.validationResult) throw error;
    logAIValidation(error.validationResult);
    logTestResult({
      status: error.validationResult.status,
      score: error.validationResult.validationScore,
      reason: error.validationResult.reason,
    });
    assert.equal(error.validationResult.status, 'FAIL');
  }
}

test('RestCountries happy path validation', async () => {
  const country = await fetchIndiaCountry();
  await expectPass({
    testName: 'RestCountries Happy Path',
    response: country,
    expectedBehavior:
      'Response should contain valid country information including name, population, region, and capital.',
    schema: {
      required: ['name.common', 'population', 'region', 'capital'],
    },
  });
});

test('RestCountries missing critical field should fail', async () => {
  const country = clone(await fetchIndiaCountry());
  delete country.population;

  await expectFail({
    testName: 'RestCountries Missing Critical Field',
    response: country,
    expectedBehavior:
      'Country response must include both name and population fields for valid demographic reporting.',
    schema: {
      required: ['name.common', 'population', 'region', 'capital'],
    },
  });
});

test('RestCountries nested field validation', async () => {
  const country = await fetchIndiaCountry();
  await expectPass({
    testName: 'RestCountries Nested Field Validation',
    response: country,
    expectedBehavior:
      'Response should contain valid nested fields including name.common, currencies, and languages.',
    schema: {
      required: ['name.common', 'currencies', 'languages'],
    },
  });
});

test('RestCountries corrupted nested data should fail', async () => {
  const country = clone(await fetchIndiaCountry());
  delete country.name.common;
  country.currencies = null;

  await expectFail({
    testName: 'RestCountries Corrupted Nested Data',
    response: country,
    expectedBehavior:
      'Country response should preserve valid nested name.common and currencies structures.',
    schema: {
      required: ['name.common', 'currencies', 'languages'],
    },
  });
});

test('RestCountries semantic population validation should fail on invalid value', async () => {
  const country = clone(await fetchIndiaCountry());
  country.population = null;

  await expectFail({
    testName: 'RestCountries Invalid Population Semantic',
    response: country,
    expectedBehavior: 'Population should be a positive number greater than zero.',
    schema: {
      required: ['name.common', 'population', 'region', 'capital'],
    },
  });
});

test('RestCountries empty response scenario should fail', async () => {
  const response = [];
  await expectFail({
    testName: 'RestCountries Empty Response Scenario',
    response,
    expectedBehavior:
      'Response should be a non-empty country object with valid country metadata fields.',
    schema: {
      required: ['name.common', 'population', 'region', 'capital'],
    },
  });
});

test('RestCountries unexpected structure should fail', async () => {
  const invalidResponse = { unexpected: 'structure' };
  await expectFail({
    testName: 'RestCountries Unexpected Structure',
    response: invalidResponse,
    expectedBehavior:
      'Response should follow a valid country object structure and include core country fields.',
    schema: {
      required: ['name.common', 'population', 'region', 'capital'],
    },
  });
});

test('RestCountries partial data scenario should fail', async () => {
  const partial = { name: { common: 'India' } };
  await expectFail({
    testName: 'RestCountries Partial Data Scenario',
    response: partial,
    expectedBehavior:
      'Partial country objects are invalid unless population, region, and capital are present.',
    schema: {
      required: ['name.common', 'population', 'region', 'capital'],
    },
  });
});

test('RestCountries combined realistic corruption should fail', async () => {
  const country = clone(await fetchIndiaCountry());
  delete country.capital;
  country.population = null;
  delete country.languages;

  await expectFail({
    testName: 'RestCountries Combined Realistic Corruption',
    response: country,
    expectedBehavior:
      'Valid country payload must include capital, positive population, and languages. Corruption in these fields should fail validation.',
    schema: {
      required: ['name.common', 'population', 'region', 'capital', 'languages'],
    },
  });
});


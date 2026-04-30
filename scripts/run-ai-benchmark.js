import { mkdir, readFile, writeFile } from 'node:fs/promises';

import {
  createMockDecision,
  createSchemaDecision,
  interpretAIResponse,
} from '../utils/aiDecisionEngine.js';

const benchmarkPath = 'tests/benchmark/ai-evaluation-benchmark.json';
const reportPath = 'reports/ai-benchmark-report.json';
const trendPath = 'reports/ai-benchmark-trend.json';
const minPassRate = Number(process.env.AI_BENCHMARK_MIN_PASS_RATE || 1);

const fixtures = JSON.parse(await readFile(benchmarkPath, 'utf8'));
const results = fixtures.map(runBenchmarkCase);
const passed = results.filter((item) => item.passed).length;
const total = results.length;
const passRate = total === 0 ? 0 : passed / total;
const categoryRates = computeCategoryRates(results);

const report = {
  generatedAt: new Date().toISOString(),
  total,
  passed,
  failed: total - passed,
  passRate,
  minimumPassRate: minPassRate,
  categoryPassRates: categoryRates,
  results,
};

await mkdir('reports', { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

const previousTrend = await readTrend(trendPath);
const nextTrend = [
  ...previousTrend,
  {
    timestamp: report.generatedAt,
    total,
    passed,
    failed: total - passed,
    passRate,
    categoryPassRates: categoryRates,
  },
].slice(-50);
await writeFile(trendPath, JSON.stringify(nextTrend, null, 2), 'utf8');

if (passRate < minPassRate) {
  console.error(
    `AI benchmark pass rate ${(passRate * 100).toFixed(1)}% below threshold ${(minPassRate * 100).toFixed(1)}%`
  );
  process.exit(1);
}

console.log(
  `AI benchmark passed: ${passed}/${total} (${(passRate * 100).toFixed(1)}%)`
);

function runBenchmarkCase(item) {
  const decision = evaluateCase(item);
  const passed =
    decision.status === item.expected.status &&
    decision.isValid === item.expected.isValid;

  return {
    id: item.id,
    category: item.category || 'uncategorized',
    description: item.description,
    expected: item.expected,
    actual: {
      status: decision.status,
      isValid: decision.isValid,
      validationScore: decision.validationScore,
      reason: decision.reason,
    },
    passed,
  };
}

function computeCategoryRates(items) {
  const grouped = new Map();
  for (const item of items) {
    const key = item.category || 'uncategorized';
    if (!grouped.has(key)) {
      grouped.set(key, { total: 0, passed: 0 });
    }
    const bucket = grouped.get(key);
    bucket.total += 1;
    if (item.passed) bucket.passed += 1;
  }

  const result = {};
  for (const [category, stats] of grouped.entries()) {
    result[category] = {
      total: stats.total,
      passed: stats.passed,
      failed: stats.total - stats.passed,
      passRate: stats.total === 0 ? 0 : stats.passed / stats.total,
    };
  }
  return result;
}

function evaluateCase(item) {
  switch (item.type) {
    case 'interpret':
      return interpretAIResponse(item.input, item.options ?? {});
    case 'schema':
      return createSchemaDecision(item.input.response, item.input.requiredFields, item.options ?? {});
    case 'mock':
      return createMockDecision(
        item.input.response,
        item.input.expectedBehavior,
        item.input.options ?? {}
      );
    default:
      throw new Error(`Unsupported benchmark type: ${item.type}`);
  }
}

async function readTrend(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return [];
  }
}

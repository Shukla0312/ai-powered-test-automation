import { run } from 'node:test';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { writeReportArtifacts } from './report-writers.js';

const [, , suiteName, testDir, outputBase] = process.argv;

if (!suiteName || !testDir || !outputBase) {
  console.error(
    'Usage: node scripts/run-node-tests-with-reports.js <suiteName> <testDir> <outputBase>'
  );
  process.exit(1);
}

const files = (await readdir(testDir))
  .filter((file) => file.endsWith('.test.js'))
  .map((file) => path.join(testDir, file))
  .sort();

if (files.length === 0) {
  console.error(`No test files found in ${testDir}`);
  process.exit(1);
}

const stream = run({ files, concurrency: 1 });
const cases = [];
const startedAt = new Date().toISOString();

for await (const event of stream) {
  if (event.type === 'test:pass') {
    cases.push({
      name: event.data.name,
      status: 'passed',
      durationMs: event.data.details?.duration_ms ?? 0,
    });
  }

  if (event.type === 'test:fail') {
    cases.push({
      name: event.data.name,
      status: 'failed',
      durationMs: event.data.details?.duration_ms ?? 0,
      message: String(event.data.details?.error?.message ?? 'Test failed'),
    });
  }
}

const summary = {
  mode: 'node-test-events',
  command: `node:test run ${testDir}`,
  suiteName,
  startedAt,
  finishedAt: new Date().toISOString(),
  total: cases.length,
  passed: cases.filter((item) => item.status === 'passed').length,
  failed: cases.filter((item) => item.status === 'failed').length,
  success: cases.every((item) => item.status === 'passed'),
  exitCode: cases.every((item) => item.status === 'passed') ? 0 : 1,
  testCases: cases,
  stdout: '',
  stderr: '',
};

await writeReportArtifacts(outputBase, summary);

process.exit(summary.success ? 0 : 1);

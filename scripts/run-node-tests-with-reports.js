import { run } from 'node:test';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

await mkdir(path.dirname(outputBase), { recursive: true });
await writeFile(`${outputBase}.json`, JSON.stringify(summary, null, 2), 'utf8');
await writeFile(`${outputBase}.xml`, toJUnitXml(summary), 'utf8');
await writeFile(`${outputBase}.html`, toHtml(summary), 'utf8');

process.exit(summary.success ? 0 : 1);

function toJUnitXml(report) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuite name="${escapeXml(report.suiteName)}" tests="${report.total}" failures="${report.failed}" errors="0" skipped="0">`,
  ];

  for (const testCase of report.testCases) {
    const base = `  <testcase classname="${escapeXml(report.suiteName)}" name="${escapeXml(testCase.name)}" time="${(testCase.durationMs / 1000).toFixed(3)}"`;
    if (testCase.status === 'failed') {
      lines.push(
        `${base}><failure message="${escapeXml(testCase.message || 'failed')}"/></testcase>`
      );
    } else {
      lines.push(`${base}/>`);
    }
  }

  lines.push('</testsuite>');
  lines.push('');
  return lines.join('\n');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function toHtml(report) {
  const rows = report.testCases
    .map((item) => {
      const badge = item.status === 'passed' ? 'PASS' : 'FAIL';
      const css = item.status === 'passed' ? 'ok' : 'fail';
      return `<tr><td>${escapeHtml(item.name)}</td><td class="${css}">${badge}</td><td>${item.durationMs ?? 0} ms</td><td>${escapeHtml(item.message || '')}</td></tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.suiteName)} Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
    h1 { margin-bottom: 8px; }
    .meta { margin: 8px 0 16px; }
    .ok { color: #0a7f2e; font-weight: 700; }
    .fail { color: #c5221f; font-weight: 700; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.suiteName)} Report</h1>
  <div class="meta">Total: ${report.total} | Passed: ${report.passed} | Failed: ${report.failed} | Success: ${report.success}</div>
  <table>
    <thead><tr><th>Test Case</th><th>Status</th><th>Duration</th><th>Message</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

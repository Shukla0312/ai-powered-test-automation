import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const [, , suiteName, outputBase, ...commandArgs] = process.argv;

if (!suiteName || !outputBase || commandArgs.length === 0) {
  console.error(
    'Usage: node scripts/run-command-with-reports.js <suiteName> <outputBase> <command...>'
  );
  process.exit(1);
}

const [command, ...args] = commandArgs;
const startedAt = new Date().toISOString();

const child = spawn(command, args, {
  shell: true,
  env: process.env,
});

let stdout = '';
let stderr = '';

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  stdout += text;
  process.stdout.write(text);
});

child.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  stderr += text;
  process.stderr.write(text);
});

child.on('close', async (exitCode) => {
  const testCases = parseAiValidationTestDetails(stdout);
  const passed = testCases.filter((item) => item.status === 'passed').length;
  const failed = testCases.filter((item) => item.status === 'failed').length;

  const report = {
    mode: 'command',
    suiteName,
    command: [command, ...args].join(' '),
    startedAt,
    finishedAt: new Date().toISOString(),
    total: testCases.length,
    passed,
    failed,
    success: exitCode === 0,
    exitCode: exitCode ?? 1,
    testCases,
    stdout,
    stderr,
  };

  await mkdir('reports', { recursive: true });
  await writeFile(`${outputBase}.json`, JSON.stringify(report, null, 2), 'utf8');
  await writeFile(`${outputBase}.xml`, toJUnitXml(report), 'utf8');

  process.exit(exitCode ?? 1);
});

function parseAiValidationTestDetails(output) {
  const lines = output.split('\n');
  const detailsStart = lines.findIndex((line) => line.trim() === 'Test Details:');
  if (detailsStart === -1) return [];

  const results = [];
  for (let i = detailsStart + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('════════')) break;
    const match = line.match(/^\s*(✓|✗|⚠)\s+(.+?)(?:\s\[\d+\/100\])?$/);
    if (!match) continue;

    const icon = match[1];
    const name = match[2].trim();
    const status = icon === '✓' ? 'passed' : 'failed';
    results.push({ name, status, durationMs: 0 });
  }
  return results;
}

function toJUnitXml(report) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuite name="${escapeXml(report.suiteName)}" tests="${report.total}" failures="${report.failed}" errors="0" skipped="0">`,
  ];

  for (const testCase of report.testCases) {
    const base = `  <testcase classname="${escapeXml(report.suiteName)}" name="${escapeXml(testCase.name)}" time="0.000"`;
    if (testCase.status === 'failed') {
      lines.push(`${base}><failure message="Test failed"/></testcase>`);
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

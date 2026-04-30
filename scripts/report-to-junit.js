import { readFile, writeFile } from 'node:fs/promises';

const [, , inputPath, outputPath, suiteNameArg] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/report-to-junit.js <input.json> <output.xml> [suiteName]');
  process.exit(1);
}

const suiteName = suiteNameArg || 'test-suite';
const report = JSON.parse(await readFile(inputPath, 'utf8'));
const tapOutput = String(report.stdout || '');

const testCases = parseTapCases(tapOutput);
const failures = testCases.filter((t) => t.status === 'failed');
const skipped = testCases.filter((t) => t.status === 'skipped');
const total = testCases.length;

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<testsuite name="${escapeXml(suiteName)}" tests="${total}" failures="${failures.length}" errors="0" skipped="${skipped.length}" time="0">`,
  ...testCases.map(toJUnitTestCaseXml),
  '</testsuite>',
  '',
].join('\n');

await writeFile(outputPath, xml, 'utf8');

function parseTapCases(text) {
  const lines = text.split('\n');
  const cases = [];
  let pendingFailure = null;

  for (const line of lines) {
    const okMatch = line.match(/^ok\s+\d+\s+-\s+(.+)$/);
    if (okMatch) {
      cases.push({ name: okMatch[1].trim(), status: 'passed' });
      pendingFailure = null;
      continue;
    }

    const notOkMatch = line.match(/^not ok\s+\d+\s+-\s+(.+)$/);
    if (notOkMatch) {
      const entry = { name: notOkMatch[1].trim(), status: 'failed', message: 'Test failed' };
      cases.push(entry);
      pendingFailure = entry;
      continue;
    }

    if (pendingFailure && line.trim().startsWith('error:')) {
      pendingFailure.message = line.trim().slice('error:'.length).trim();
    }

    if (pendingFailure && line.trim().startsWith('...')) {
      pendingFailure = null;
    }
  }

  return cases;
}

function toJUnitTestCaseXml(testCase) {
  const name = escapeXml(testCase.name);
  if (testCase.status === 'failed') {
    return `  <testcase name="${name}" classname="${escapeXml(suiteName)}"><failure message="${escapeXml(testCase.message || 'failed')}"/></testcase>`;
  }
  if (testCase.status === 'skipped') {
    return `  <testcase name="${name}" classname="${escapeXml(suiteName)}"><skipped/></testcase>`;
  }
  return `  <testcase name="${name}" classname="${escapeXml(suiteName)}"/>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

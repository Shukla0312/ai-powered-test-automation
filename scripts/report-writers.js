import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function writeReportArtifacts(outputBase, report) {
  await mkdir(path.dirname(outputBase), { recursive: true });
  await writeFile(`${outputBase}.json`, JSON.stringify(report, null, 2), 'utf8');
  await writeFile(`${outputBase}.xml`, toJUnitXml(report), 'utf8');
  await writeFile(`${outputBase}.html`, toHtml(report), 'utf8');
}

function toJUnitXml(report) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuite name="${escapeXml(report.suiteName)}" tests="${report.total}" failures="${report.failed}" errors="0" skipped="0">`,
  ];

  for (const testCase of report.testCases) {
    const duration = Number(testCase.durationMs ?? 0);
    const base = `  <testcase classname="${escapeXml(report.suiteName)}" name="${escapeXml(testCase.name)}" time="${(duration / 1000).toFixed(3)}"`;
    if (testCase.status === 'failed') {
      lines.push(
        `${base}><failure message="${escapeXml(testCase.message || 'Test failed')}"/></testcase>`
      );
    } else {
      lines.push(`${base}/>`);
    }
  }

  lines.push('</testsuite>');
  lines.push('');
  return lines.join('\n');
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

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}


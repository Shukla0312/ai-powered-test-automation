import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const [, , reportPath, ...commandArgs] = process.argv;

if (!reportPath || commandArgs.length === 0) {
  console.error('Usage: node scripts/run-and-report.js <reportPath> <command...>');
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
  const report = {
    command: [command, ...args].join(' '),
    startedAt,
    finishedAt: new Date().toISOString(),
    exitCode,
    success: exitCode === 0,
    stdout,
    stderr,
  };

  const reportDir = reportPath.split('/').slice(0, -1).join('/');
  if (reportDir) {
    await mkdir(reportDir, { recursive: true });
  }

  await writeFile(reportPath, JSON.stringify(report, null, 2));
  process.exit(exitCode ?? 1);
});

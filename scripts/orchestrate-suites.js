import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const [, , profileArg = 'pr', concurrencyArg = '2'] = process.argv;
const profile = profileArg.toLowerCase();
const concurrency = Math.max(1, Number(concurrencyArg) || 2);

const manifest = JSON.parse(await readFile('tests/integration/scenario-manifest.json', 'utf8'));
const filtered = filterByProfile(manifest, profile);
const shards = buildShards(filtered);

const queue = [...shards];
const workers = [];
const completed = [];

for (let i = 0; i < concurrency; i++) {
  workers.push(runWorker(i + 1));
}

await Promise.all(workers);

const success = completed.every((item) => item.success);
const report = {
  profile,
  concurrency,
  generatedAt: new Date().toISOString(),
  shardCount: shards.length,
  results: completed,
  success,
};

await mkdir('reports', { recursive: true });
await writeFile('reports/orchestration-report.json', JSON.stringify(report, null, 2), 'utf8');

console.log(
  `Orchestration finished: ${completed.filter((r) => r.success).length}/${completed.length} shards passed`
);
process.exit(success ? 0 : 1);

async function runWorker(workerId) {
  while (queue.length > 0) {
    const shard = queue.shift();
    if (!shard) break;
    const result = await runShard(shard, workerId);
    completed.push(result);
  }
}

function filterByProfile(entries, executionProfile) {
  if (executionProfile === 'release') return entries;
  if (executionProfile === 'nightly') {
    return entries.filter((item) => item.risk !== 'low');
  }
  return entries.filter((item) => item.risk === 'critical' || item.risk === 'high');
}

function buildShards(entries) {
  const shardMap = new Map();
  for (const item of entries) {
    const key = `${item.domain}:${item.risk}:${item.tenant}`;
    if (!shardMap.has(key)) {
      shardMap.set(key, {
        shardKey: key,
        domain: item.domain,
        risk: item.risk,
        tenant: item.tenant,
        command: item.command,
        scenarioIds: [],
      });
    }
    shardMap.get(key).scenarioIds.push(item.id);
  }
  return [...shardMap.values()];
}

async function runShard(shard, workerId) {
  const startedAt = new Date().toISOString();
  const output = await execCommand(shard.command);

  return {
    workerId,
    shardKey: shard.shardKey,
    domain: shard.domain,
    risk: shard.risk,
    tenant: shard.tenant,
    scenarioIds: shard.scenarioIds,
    command: shard.command,
    startedAt,
    finishedAt: new Date().toISOString(),
    success: output.exitCode === 0,
    exitCode: output.exitCode,
    stdout: output.stdout,
    stderr: output.stderr,
  };
}

function execCommand(command) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk.toString());
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk.toString());
    });

    child.on('close', (exitCode) => {
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

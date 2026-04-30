import { access, readFile } from 'node:fs/promises';

const manifestPath = 'tests/integration/scenario-manifest.json';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const errors = [];
const validRisks = new Set(['critical', 'high', 'medium', 'low']);
const riskPolicy = {
  critical: {
    minScore: 80,
    mandatoryGates: ['schema', 'semantic', 'invariant'],
  },
  high: {
    minScore: 80,
    mandatoryGates: ['schema', 'semantic', 'invariant'],
  },
  medium: {
    minScore: 75,
    mandatoryGates: ['schema', 'semantic'],
  },
  low: {
    minScore: 70,
    mandatoryGates: ['schema'],
  },
};

for (const [index, scenario] of manifest.entries()) {
  const pointer = `scenario[${index}] ${scenario.id ?? '<missing-id>'}`;
  const requiredFields = [
    'id',
    'domain',
    'risk',
    'tenant',
    'policyRef',
    'testFile',
    'minScore',
    'mandatoryGates',
  ];

  for (const field of requiredFields) {
    if (!scenario[field]) {
      errors.push(`${pointer}: missing required field "${field}"`);
    }
  }

  if (scenario.risk && !validRisks.has(scenario.risk)) {
    errors.push(`${pointer}: invalid risk "${scenario.risk}"`);
  }

  if (scenario.risk && scenario.minScore !== undefined) {
    const expectedScore = riskPolicy[scenario.risk].minScore;
    if (Number(scenario.minScore) < expectedScore) {
      errors.push(`${pointer}: minScore ${scenario.minScore} below policy minimum ${expectedScore}`);
    }
  }

  if (scenario.risk && Array.isArray(scenario.mandatoryGates)) {
    const requiredGates = riskPolicy[scenario.risk].mandatoryGates;
    for (const gate of requiredGates) {
      if (!scenario.mandatoryGates.includes(gate)) {
        errors.push(`${pointer}: missing mandatory gate "${gate}" for risk ${scenario.risk}`);
      }
    }
  }

  if (scenario.policyRef) {
    await assertFileExists(scenario.policyRef, `${pointer}: policyRef does not exist`);
  }

  if (scenario.testFile) {
    await assertFileExists(scenario.testFile, `${pointer}: testFile does not exist`);
  }
}

if (errors.length > 0) {
  console.error('Scenario governance validation failed:');
  for (const issue of errors) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Scenario governance validation passed for ${manifest.length} scenarios.`);

async function assertFileExists(path, message) {
  try {
    await access(path);
  } catch {
    errors.push(message);
  }
}

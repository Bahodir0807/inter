import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const allowedEnvTemplates = new Set([
  '.env.example',
  '.env.local.example',
  '.env.production.example',
  '.env.qa.example',
  '.env.smoke.example',
]);

const disallowedEnvFiles = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.qa',
  '.env.staging',
];

const trackedFiles = git(['ls-files']);
const trackedRealEnvFiles = trackedFiles.filter((file) => {
  if (allowedEnvTemplates.has(file)) return false;
  return disallowedEnvFiles.includes(file) || /^\.env\..*\.local$/.test(file);
});

const presentTrackedEnvFiles = trackedRealEnvFiles.filter((file) => existsSync(file));
if (presentTrackedEnvFiles.length > 0) {
  console.error('Tracked real env files found. Move values into local env files and keep only *.example templates:');
  for (const file of presentTrackedEnvFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const secretAssignmentPattern =
  /\b(?:secret|password|passwd|token|api[_-]?key|private[_-]?key|mongodb_uri|database_url)\b\s*=\s*(?!$|["']?\s*(?:changeme|example|placeholder|todo|false|true)["']?\s*$)/i;

const scannableConfigPattern = /\.(?:env|example|md|json|ya?ml|conf|txt)$/i;
const scanFiles = trackedFiles.filter((file) => {
  if (!existsSync(file)) return false;
  if (file.startsWith('dist/') || file.startsWith('node_modules/') || file.startsWith('reports/')) return false;
  return scannableConfigPattern.test(file) || file === 'Dockerfile' || file === '.dockerignore' || file === '.gitignore';
});

const possibleSecretFiles = [];
for (const file of scanFiles) {
  const text = readFileSync(file, 'utf8');
  if (secretAssignmentPattern.test(text)) {
    possibleSecretFiles.push(file);
  }
}

if (possibleSecretFiles.length > 0) {
  console.error('Possible secret assignments found. Values were not printed:');
  for (const file of possibleSecretFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('repo hygiene: no committed real env files or obvious secret assignments found');

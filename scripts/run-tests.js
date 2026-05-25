
import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const GRAY = '\x1b[90m';

function collectTests(rootDir) {
  const testFiles = [];
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist' && e.name !== 'coverage' && e.name !== 'public') {
        walk(p);
      } else if (e.isFile() && (e.name.endsWith('.test.jsx') || e.name.endsWith('.test.js') || e.name.endsWith('.test.tsx') || e.name.endsWith('.test.ts'))) {
        testFiles.push(p);
      }
    }
  }
  walk(rootDir);
  return testFiles;
}

function groupByDir(files, rootDir) {
  const groups = {};
  for (const f of files) {
    const rel = f.startsWith(rootDir) ? f.slice(rootDir.length + 1) : f;
    const dir = rel.includes('/') ? rel.substring(0, rel.lastIndexOf('/')) : '(root)';
    if (!groups[dir]) groups[dir] = [];
    groups[dir].push(rel.substring(rel.lastIndexOf('/') + 1));
  }
  return groups;
}

function printSummary(exitCode, startTime) {
  const testFiles = collectTests(root);
  const groups = groupByDir(testFiles, root);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  const bar = `${GRAY}═${RESET}`.repeat(58);
  console.log(`\n  ${bar}`);
  console.log(`  ${BOLD}${exitCode === 0 ? GREEN + '✅  ALL TESTS PASSED' : RED + '❌  SOME TESTS FAILED'}${RESET}`);
  console.log(`  ${GRAY}╌${RESET}`.repeat(58));

  console.log(`\n  ${BOLD}${CYAN}📋  Test Structure Overview${RESET}\n`);

  const dirLabels = {
    'src/components': 'Component Tests',
    'src/context': 'Context Provider Tests',
    'src/hooks': 'Custom Hook Tests',
    'src': 'App / Utility Tests',
    '(root)': 'Root-Level Tests',
  };

  for (const [dir, files] of Object.entries(groups)) {
    const label = dirLabels[dir] || dir || 'Other';
    console.log(`  ${BOLD}${YELLOW}${label}${RESET} ${GRAY}(${dir})${RESET}`);
    for (const f of files) {
      const name = f.replace(/\.(test\.(jsx?|tsx?))$/, '');
      console.log(`    ${GRAY}│${RESET}  ${name}`);
    }
    console.log();
  }

  const totalTests = testFiles.length;
  console.log(`  ${bar}`);
  console.log(`  ${BOLD}Test Files:${RESET}  ${totalTests}`);
  console.log(`  ${BOLD}Duration:${RESET}    ${elapsed}s`);
  console.log(`  ${BOLD}Status:${RESET}    ${exitCode === 0 ? GREEN + 'PASSED' : RED + 'FAILED'}${RESET}`);
  console.log(`  ${bar}\n`);
}

const startTime = Date.now();

const result = spawnSync('npx', ['vitest', '--run', '--reporter=verbose'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

printSummary(result.status, startTime);
// eslint-disable-next-line no-undef
process.exit(result.status ?? 1);

import { spawn } from 'node:child_process';

const PORTS = {
  frontend: 3000,
  backend: 3001,
};

const procs = [];
let shuttingDown = false;

function prefix(label, color) {
  const codes = { cyan: '\x1b[36m', yellow: '\x1b[33m', dim: '\x1b[2m', reset: '\x1b[0m' };
  return (data) => {
    String(data)
      .split('\n')
      .filter(Boolean)
      .forEach((line) => {
        process.stdout.write(`${color}[${label}]${codes.reset} ${line}\n`);
      });
  };
}

function spawnDev(name, cmd, args, cwd, color) {
  const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: true });
  child.stdout.on('data', prefix(name, color));
  child.stderr.on('data', prefix(name, color));
  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`\n[dev] ${name} exited with code ${code}. Stopping everything.`);
      shutdown(1);
    }
  });
  procs.push(child);
  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n[dev] Shutting down...');
  for (const p of procs) {
    if (p && !p.killed) p.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log('[dev] Starting Pehenavas development environment...\n');

// Backend: Express API on 3001
// --no-deprecation silences the harmless Node "punycode deprecated" warning
// emitted by a transitive dependency (tr46/whatwg-url under firebase-admin).
spawnDev('server', 'node', ['--no-deprecation', 'server.js'], process.cwd(), '\x1b[33m');
// Frontend: Vite HMR dev server on 3000
spawnDev('frontend', 'npm', ['run', 'dev'], process.cwd(), '\x1b[36m');

console.log(`\n[dev] Frontend:  http://localhost:${PORTS.frontend}`);
console.log(`[dev] Backend:   http://localhost:${PORTS.backend}/api`);
console.log('[dev] Press Ctrl+C to stop both.\n');

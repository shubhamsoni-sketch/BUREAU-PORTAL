import { spawn } from 'node:child_process';

const baseUrl = 'http://127.0.0.1:4028';
const requiredHeaders = {
  'cache-control': /private.*no-store/i,
  pragma: /no-cache/i,
  'referrer-policy': /no-referrer/i,
  'x-content-type-options': /nosniff/i,
};

const server = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['start'], {
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
for (const stream of [server.stdout, server.stderr]) {
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    output = `${output}${chunk}`.slice(-8000);
  });
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchUntilReady(path) {
  const deadline = Date.now() + 30000;
  let lastError;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Production server exited before readiness (${server.exitCode}).\n${output}`);
    }
    try {
      return await fetch(`${baseUrl}${path}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(3000),
      });
    } catch (error) {
      lastError = error;
      await delay(250);
    }
  }
  throw new Error(`Production server did not become ready: ${String(lastError)}\n${output}`);
}

function assertPrivateHeaders(response, label) {
  for (const [name, expected] of Object.entries(requiredHeaders)) {
    const value = response.headers.get(name) || '';
    if (!expected.test(value)) {
      throw new Error(
        `${label} missing required ${name} response control; received ${value || '<none>'}`
      );
    }
  }
}

try {
  const page = await fetchUntilReady('/admin-lender-intelligence');
  if (page.status !== 200) {
    throw new Error(`Protected workspace returned HTTP ${page.status}, expected 200 login shell.`);
  }
  assertPrivateHeaders(page, 'Protected workspace');

  const api = await fetchUntilReady('/api/admin-lender-intelligence');
  const apiBody = await api.json().catch(() => null);
  if (api.status !== 401 || apiBody?.success !== false || apiBody?.error !== 'Unauthorized') {
    throw new Error(
      `Unauthenticated API contract failed: HTTP ${api.status}, body ${JSON.stringify(apiBody)}`
    );
  }
  assertPrivateHeaders(api, 'Protected API');

  console.log(
    'PASS production runtime smoke: built server started, protected headers passed, unauthenticated API denied.'
  );
} finally {
  if (server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => server.once('exit', resolve)),
      delay(5000).then(() => {
        if (server.exitCode === null) server.kill('SIGKILL');
      }),
    ]);
  }
}

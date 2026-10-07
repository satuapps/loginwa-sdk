#!/usr/bin/env node
/**
 * Smoke the bundled MCPB entry over stdio with no credentials.
 * Expects tools/list to succeed and a tool call to fail until LOGINWA_API_KEY is set.
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const entry = process.argv[2];
if (!entry) {
  console.error('usage: node scripts/mcpb-smoke.mjs <server/index.js>');
  process.exit(2);
}

const env = { ...process.env };
delete env.LOGINWA_API_KEY;
delete env.LOGINWA_BASE_URL;

const child = spawn(process.execPath, [entry], {
  env,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';
child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  stdout += chunk;
});
child.stderr.on('data', (chunk) => {
  stderr += chunk;
});

function send(msg) {
  child.stdin.write(`${JSON.stringify(msg)}\n`);
}

function waitForId(id, timeoutMs = 8000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      const lines = stdout.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === id) {
            clearInterval(timer);
            resolve(parsed);
            return;
          }
        } catch {
          // ignore partial lines
        }
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(
          new Error(
            `timed out waiting for id=${id}\nstdout:\n${stdout}\nstderr:\n${stderr}`,
          ),
        );
      }
    }, 50);
  });
}

try {
  send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'mcpb-smoke', version: '0.1.0' },
    },
  });
  const init = await waitForId(1);
  if (init.error) {
    throw new Error(`initialize failed: ${JSON.stringify(init.error)}`);
  }

  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const listed = await waitForId(2);
  const names = (listed.result?.tools ?? []).map((t) => t.name).sort();
  const expected = [
    'create_campaign',
    'delete_message',
    'device_status',
    'get_campaign',
    'get_message',
    'list_campaigns',
    'otp_start',
    'otp_verify',
    'reverse_otp_start',
    'reverse_otp_status',
    'send_campaign',
    'send_message',
  ];
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error(`unexpected tools: ${JSON.stringify(names)}`);
  }

  send({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'device_status', arguments: {} },
  });
  const called = await waitForId(3);
  const payload = JSON.stringify(called);
  if (!/LOGINWA_API_KEY/.test(payload)) {
    throw new Error(`tool call without key should mention LOGINWA_API_KEY: ${payload}`);
  }

  console.log('mcpb-smoke: tools/list ok, tool call without key fails as expected');
  console.log(`mcpb-smoke: tools=${names.join(',')}`);
} finally {
  child.stdin.end();
  child.kill('SIGTERM');
  await Promise.race([once(child, 'exit'), new Promise((r) => setTimeout(r, 1000))]);
}

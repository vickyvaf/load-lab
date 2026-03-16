import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface TestConfig {
  url: string;
  method: string;
  vus: number;
  duration: string;
  headers: Record<string, string>;
  body: string;
  stages: { duration: string; target: number }[];
  thresholds: Record<string, string[]>;
}

export interface TestMetrics {
  totalRequests: number;
  success: number;
  clientErrors: number;
  serverErrors: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  reqPerSec: number;
  failedChecks: number;
}

interface TestProcess {
  process: ChildProcess;
  emitter: EventEmitter;
  config: TestConfig;
  metrics: TestMetrics;
  scriptPath: string;
}

// Use globalThis to persist the Map across HMR restarts and between different API route handlers in Next.js
const globalForK6 = globalThis as unknown as {
  activeTests: Map<string, TestProcess>;
};

const activeTests = globalForK6.activeTests ?? new Map<string, TestProcess>();

if (process.env.NODE_ENV !== 'production') {
  globalForK6.activeTests = activeTests;
}

function generateK6Script(config: TestConfig): string {
  const hasStages = config.stages && config.stages.length > 0;

  const headersStr = Object.keys(config.headers).length > 0
    ? JSON.stringify(config.headers)
    : '{}';

  const optionsObj: Record<string, unknown> = {};

  if (hasStages) {
    optionsObj.stages = config.stages.map(s => ({
      duration: s.duration,
      target: s.target,
    }));
  } else {
    optionsObj.vus = config.vus;
    optionsObj.duration = config.duration;
  }

  if (Object.keys(config.thresholds).length > 0) {
    optionsObj.thresholds = config.thresholds;
  }

  const bodySection = config.body
    ? `const payload = ${JSON.stringify(config.body)};`
    : `const payload = null;`;

  const methodStr = config.method.toUpperCase();
  let requestCall: string;

  if (methodStr === 'GET' || methodStr === 'DELETE') {
    requestCall = `http.${methodStr.toLowerCase()}(url, { headers: headers, tags: { name: 'request' } })`;
  } else {
    requestCall = `http.${methodStr.toLowerCase()}(url, payload, { headers: headers, tags: { name: 'request' } })`;
  }

  return `
import http from 'k6/http';
import { check } from 'k6';

export const options = ${JSON.stringify(optionsObj, null, 2)};

const url = ${JSON.stringify(config.url)};
const headers = ${headersStr};
${bodySection}

export default function () {
  const res = ${requestCall};

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });
}
`;
}

export function startTest(config: TestConfig): { testId: string } {
  const testId = uuidv4();
  const emitter = new EventEmitter();
  emitter.setMaxListeners(20);

  // Write script to temp file
  const scriptContent = generateK6Script(config);
  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, `k6-script-${testId}.js`);
  fs.writeFileSync(scriptPath, scriptContent, 'utf-8');

  const metrics: TestMetrics = {
    totalRequests: 0,
    success: 0,
    clientErrors: 0,
    serverErrors: 0,
    avgResponseTime: 0,
    p95ResponseTime: 0,
    reqPerSec: 0,
    failedChecks: 0,
  };

  // Spawn K6 with JSON summary output
  const k6Process = spawn('k6', ['run', '--out', 'json=-', scriptPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  const testProcess: TestProcess = {
    process: k6Process,
    emitter,
    config,
    metrics,
    scriptPath,
  };

  activeTests.set(testId, testProcess);

  // Parse K6 JSON output (each line is a JSON object)
  let buffer = '';
  k6Process.stdout?.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line);
        processK6JsonLine(testId, data);
      } catch {
        // Not JSON — emit as log
        emitter.emit('log', {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: line,
        });
      }
    }
  });

  // Capture stderr as logs
  k6Process.stderr?.on('data', (chunk: Buffer) => {
    const lines = chunk.toString().split('\n').filter(l => l.trim());
    for (const line of lines) {
      let level: 'info' | 'warn' | 'error' = 'info';
      if (line.toLowerCase().includes('warn')) level = 'warn';
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail')) level = 'error';

      emitter.emit('log', {
        timestamp: new Date().toISOString(),
        level,
        message: line,
      });
    }
  });

  k6Process.on('close', (code) => {
    emitter.emit('log', {
      timestamp: new Date().toISOString(),
      level: code === 0 ? 'info' : 'error',
      message: `K6 process exited with code ${code}`,
    });

    emitter.emit('done', {
      status: code === 0 ? 'completed' : 'failed',
    });

    // Cleanup
    try { fs.unlinkSync(scriptPath); } catch { /* ignore */ }
    setTimeout(() => {
      activeTests.delete(testId);
    }, 30000); // Keep for 30s for SSE to drain
  });

  k6Process.on('error', (err) => {
    emitter.emit('log', {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `K6 process error: ${err.message}`,
    });
    emitter.emit('done', { status: 'error' });
  });

  return { testId };
}

function processK6JsonLine(testId: string, data: Record<string, unknown>) {
  const test = activeTests.get(testId);
  if (!test) return;

  const type = data.type as string;
  const metric = data.metric as string;

  if (type === 'Point' && data.data) {
    const pointData = data.data as Record<string, unknown>;
    const value = pointData.value as number;
    const tags = (pointData.tags || {}) as Record<string, unknown>;

    if (metric === 'http_reqs') {
      test.metrics.totalRequests += value;

      // Check status from tags
      const status = tags.status ? Number(tags.status) : 0;
      if (status >= 200 && status < 300) {
        test.metrics.success += value;
      } else if (status >= 400 && status < 500) {
        test.metrics.clientErrors += value;
      } else if (status >= 500) {
        test.metrics.serverErrors += value;
      }
    }

    if (metric === 'http_req_duration') {
      // Running average
      const count = test.metrics.totalRequests || 1;
      test.metrics.avgResponseTime =
        (test.metrics.avgResponseTime * (count - 1) + value) / count;

      // Track p95 approximation (use max seen as simple approximation)
      if (value > test.metrics.p95ResponseTime) {
        test.metrics.p95ResponseTime = value;
      }
    }

    if (metric === 'http_reqs') {
      // Calculate req/s from elapsed time
      const timestamp = pointData.time as string;
      if (timestamp && test.metrics.totalRequests > 0) {
        try {
          const elapsed = (new Date(timestamp).getTime() - Date.now()) / 1000;
          if (Math.abs(elapsed) > 0) {
            test.metrics.reqPerSec = test.metrics.totalRequests / Math.abs(elapsed);
          }
        } catch { /* ignore */ }
      }
    }

    if (metric === 'checks') {
      if (!value) {
        test.metrics.failedChecks += 1;
      }
    }

    // Emit metrics update (throttled: emit on every data point)
    test.emitter.emit('metrics', { ...test.metrics });
  }
}

export function stopTest(testId: string): boolean {
  const test = activeTests.get(testId);
  if (!test) return false;

  try {
    test.process.kill('SIGTERM');
    // Force kill after 5 seconds
    setTimeout(() => {
      try { test.process.kill('SIGKILL'); } catch { /* ignore */ }
    }, 5000);
    return true;
  } catch {
    return false;
  }
}

export function getTestEmitter(testId: string): EventEmitter | null {
  const test = activeTests.get(testId);
  return test?.emitter || null;
}

export function getTestMetrics(testId: string): TestMetrics | null {
  const test = activeTests.get(testId);
  return test?.metrics || null;
}

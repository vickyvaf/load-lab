export interface TestConfig {
  url: string;
  method: string;
  vus: number | string;
  duration: string;
  headers: { key: string; value: string }[];
  body: string;
  stages: { duration: string; target: number | string }[];
  thresholds: { key: string; value: string }[];
  useStages: boolean;
}

export interface Metrics {
  totalRequests: number;
  success: number;
  clientErrors: number;
  serverErrors: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  reqPerSec: number;
  failedChecks: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

'use client';

import type { Metrics } from '@/types';

interface StatisticsPanelProps {
  metrics: Metrics;
}

interface StatCard {
  key: keyof Metrics;
  label: string;
  icon: string;
  className: string;
  unit?: string;
  format?: (val: number) => string;
}

const cards: StatCard[] = [
  { key: 'totalRequests', label: 'Total Requests', icon: '📊', className: 'total' },
  { key: 'success', label: 'Success (2xx)', icon: '✅', className: 'success' },
  { key: 'clientErrors', label: 'Client Errors (4xx)', icon: '⚠️', className: 'client-error' },
  { key: 'serverErrors', label: 'Server Errors (5xx)', icon: '❌', className: 'server-error' },
  {
    key: 'avgResponseTime',
    label: 'Avg Response Time',
    icon: '⏱️',
    className: 'avg-rt',
    unit: 'ms',
    format: (v) => v.toFixed(1),
  },
  {
    key: 'p95ResponseTime',
    label: 'P95 Response Time',
    icon: '📈',
    className: 'p95',
    unit: 'ms',
    format: (v) => v.toFixed(1),
  },
  {
    key: 'reqPerSec',
    label: 'Req/s',
    icon: '⚡',
    className: 'rps',
    format: (v) => v.toFixed(1),
  },
  { key: 'failedChecks', label: 'Failed Checks', icon: '🚫', className: 'failed' },
];

function formatNumber(val: number, formatter?: (v: number) => string): string {
  if (formatter) return formatter(val);
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
  if (val >= 1_000) return (val / 1_000).toFixed(1) + 'K';
  return val.toLocaleString();
}

export default function StatisticsPanel({ metrics }: StatisticsPanelProps) {
  return (
    <section className="glass-card stats-panel animate-in" id="statistics-panel">
      <div className="section-title">
        <span className="section-title-icon">📊</span>
        Statistics
      </div>
      <div className="stats-grid">
        {cards.map((card) => (
          <div key={card.key} className={`stat-card ${card.className}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">
              {formatNumber(metrics[card.key], card.format)}
              {card.unit && <span className="stat-unit">{card.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

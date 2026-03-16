'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { LogEntry } from '@/types';

interface LogsPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export default function LogsPanel({ logs, onClear }: LogsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopy = useCallback(() => {
    const text = logs
      .map((l) => `[${l.level.toUpperCase()}] ${l.timestamp} ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  }, [logs]);

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return ts;
    }
  };

  return (
    <section className="glass-card logs-panel animate-in" id="logs-panel">
      <div className="logs-header">
        <div className="section-title" style={{ marginBottom: 0 }}>
          <span className="section-title-icon">📋</span>
          Logs
        </div>
        <div className="logs-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClear} id="clear-logs-btn">
            🗑️ Clear
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleCopy} id="copy-logs-btn">
            📋 Copy
          </button>
        </div>
      </div>
      <div className="logs-container" ref={containerRef}>
        {logs.length === 0 ? (
          <div className="logs-empty">
            <div className="logs-empty-icon">📝</div>
            <div>No logs yet. Start a test to see output here.</div>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`log-line ${log.level}`}>
              <span className={`log-badge ${log.level}`}>
                {log.level === 'info' ? 'INFO' : log.level === 'warn' ? 'WARN' : 'ERR'}
              </span>
              <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import TestConfigPanel from "@/components/TestConfigPanel";
import StatisticsPanel from "@/components/StatisticsPanel";
import LogsPanel from "@/components/LogsPanel";

import { TestConfig, Metrics, LogEntry } from "@/types";

const initialMetrics: Metrics = {
  totalRequests: 0,
  success: 0,
  clientErrors: 0,
  serverErrors: 0,
  avgResponseTime: 0,
  p95ResponseTime: 0,
  reqPerSec: 0,
  failedChecks: 0,
};

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [testId, setTestId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const connectSSE = useCallback(
    (id: string) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(`/api/test/stream?testId=${id}`);
      eventSourceRef.current = es;

      es.addEventListener("metrics", (event) => {
        try {
          const data = JSON.parse(event.data);
          setMetrics(data);
        } catch {
          /* ignore parse errors */
        }
      });

      es.addEventListener("log", (event) => {
        try {
          const data = JSON.parse(event.data);
          setLogs((prev) => [...prev, data]);
        } catch {
          /* ignore parse errors */
        }
      });

      es.addEventListener("done", (event) => {
        try {
          const data = JSON.parse(event.data);
          setIsRunning(false);
          showToast(
            data.status === "completed"
              ? "Test completed successfully!"
              : `Test ended: ${data.status}`,
            data.status === "completed" ? "success" : "error",
          );
        } catch {
          /* ignore */
        }
        es.close();
        eventSourceRef.current = null;
      });

      es.addEventListener("error", () => {
        // SSE connection error — might mean test finished
      });
    },
    [showToast],
  );

  const handleStartTest = useCallback(
    async (config: TestConfig) => {
      try {
        setMetrics(initialMetrics);
        setLogs([]);

        const payload = {
          url: config.url,
          method: config.method,
          vus: config.vus,
          duration: config.duration,
          headers: config.headers.reduce(
            (acc, h) => {
              if (h.key.trim()) acc[h.key] = h.value;
              return acc;
            },
            {} as Record<string, string>,
          ),
          body: config.body || "",
          stages: config.useStages
            ? config.stages.filter((s) => s.duration && s.target > 0)
            : [],
          thresholds: config.thresholds.reduce(
            (acc, t) => {
              if (t.key.trim()) acc[t.key] = [t.value];
              return acc;
            },
            {} as Record<string, string[]>,
          ),
        };

        const res = await fetch("/api/test/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to start test");
        }

        const data = await res.json();
        setTestId(data.testId);
        setIsRunning(true);
        showToast("Test started!", "success");

        connectSSE(data.testId);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Failed to start test",
          "error",
        );
      }
    },
    [connectSSE, showToast],
  );

  const handleStopTest = useCallback(async () => {
    if (!testId) return;
    try {
      await fetch("/api/test/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });
      setIsRunning(false);
      showToast("Test stopped", "success");
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    } catch {
      showToast("Failed to stop test", "error");
    }
  }, [testId, showToast]);

  const handleClearLogs = useCallback(() => setLogs([]), []);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">🚀</div>
          <div>
            <h1>LoadLab</h1>
            <div className="app-logo-subtitle">K6 Load Testing</div>
          </div>
        </div>
        <div className="header-badge">
          <span className={`status-dot ${isRunning ? "running" : ""}`}></span>
          {isRunning ? "Test Running" : "Idle"}
        </div>
      </header>

      <main>
        <TestConfigPanel
          onStartTest={handleStartTest}
          onStopTest={handleStopTest}
          isRunning={isRunning}
        />
        <StatisticsPanel metrics={metrics} />
        <LogsPanel logs={logs} onClear={handleClearLogs} />
      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

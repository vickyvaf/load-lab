"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import TestConfigPanel from "@/components/TestConfigPanel";
import StatisticsPanel from "@/components/StatisticsPanel";
import LogsPanel from "@/components/LogsPanel";
import { cn } from "@/lib/utils";

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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const parseK6Duration = (d: string): number => {
    if (!d) return 0;
    const regex = /(\d+)([smh])/g;
    let totalSeconds = 0;
    let match;
    while ((match = regex.exec(d)) !== null) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      if (unit === 's') totalSeconds += value;
      else if (unit === 'm') totalSeconds += value * 60;
      else if (unit === 'h') totalSeconds += value * 3600;
    }
    return totalSeconds || parseInt(d, 10) || 0;
  };

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const elapsedSeconds = startTime ? Math.floor((currentTime - startTime) / 1000) : 0;
  const timeLeft = Math.max(0, totalDurationSeconds - elapsedSeconds);
  const progressPercent = totalDurationSeconds > 0 
    ? Math.min(100, Math.max(0, (elapsedSeconds / totalDurationSeconds) * 100))
    : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
          setStartTime(null); // Reset timer
          showToast(
            data.status === "completed"
              ? "Test finished!"
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

        // Calculate total duration
        const duration = config.useStages
          ? config.stages.reduce((acc, s) => acc + parseK6Duration(s.duration), 0)
          : parseK6Duration(config.duration);
        
        setTotalDurationSeconds(duration);
        
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
            ? config.stages
              .filter((s) => s.duration && (Number(s.target) > 0))
              .map((s) => ({ ...s, target: Number(s.target) }))
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
        setStartTime(Date.now());
        setCurrentTime(Date.now());
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
      setStartTime(null); // Reset timer
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
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8 max-w-7xl space-y-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-xl sm:text-2xl shadow-lg ring-1 ring-primary/20">
            🚀
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">LoadLab</h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
              K6 Load Testing Engine
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-full border border-border/50">
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-shadow duration-1000",
                isRunning
                  ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"
                  : "bg-muted-foreground",
              )}
            ></span>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {isRunning ? "Test Running" : "Idle"}
            </span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8">
          <TestConfigPanel
            onStartTest={handleStartTest}
            onStopTest={handleStopTest}
            isRunning={isRunning}
            timeLeft={timeLeft}
            progressPercent={progressPercent}
          />
        </div>
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <StatisticsPanel metrics={metrics} />
          <LogsPanel logs={logs} onClear={handleClearLogs} />
        </div>
      </main>

      {toast && (
        <div
          className={cn(
            "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 px-6 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-4 transition-all z-50",
            toast.type === "success"
              ? "bg-primary text-primary-foreground"
              : "bg-destructive text-destructive-foreground",
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

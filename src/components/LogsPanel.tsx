import { useRef, useEffect, useCallback, useState } from 'react';
import type { LogEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Terminal, Trash2, Copy, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface LogsPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export default function LogsPanel({ logs, onClear }: LogsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs]);

  const handleCopy = useCallback(() => {
    const text = logs
      .map((l) => `[${l.level.toUpperCase()}] ${l.timestamp} ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { });
  }, [logs]);

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          Live Output Logs
        </CardTitle>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="ghost" size="sm" onClick={onClear} className="flex-1 sm:flex-none h-8 text-xs gap-1.5 border sm:border-none">
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="flex-1 sm:flex-none h-8 text-xs gap-1.5 border sm:border-none">
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea type="always" className="h-[350px] w-full rounded-md border bg-black/5 p-4" ref={scrollRef}>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-3 opacity-50">
              <FileText className="w-10 h-10" />
              <p className="text-sm font-medium">No logs recorded yet</p>
            </div>
          ) : (
            <div className="space-y-1.5 font-mono text-[13px] leading-relaxed min-w-max">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 group whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={
                      log.level === 'info' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' :
                        log.level === 'warn' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' :
                          'text-red-500 border-red-500/20 bg-red-500/5'
                    }
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className="text-muted-foreground/60 shrink-0 select-none">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className={cn(
                    "whitespace-nowrap",
                    log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                        'text-foreground/90'
                  )}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

import type { Metrics } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CheckCircle2, AlertTriangle, XCircle, Timer, TrendingUp, Zap, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatisticsPanelProps {
  metrics: Metrics;
}

interface StatCardConfig {
  key: keyof Metrics;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  unit?: string;
  format?: (val: number) => string;
  getUnit?: (val: number) => string;
}

const formatDuration = (ms: number): { value: string; unit: string } => {
  if (ms < 1000) {
    return { value: parseFloat(ms.toFixed(1)).toString(), unit: 'ms' };
  }
  const s = ms / 1000;
  if (s < 60) {
    return { value: parseFloat(s.toFixed(2)).toString(), unit: 's' };
  }
  const m = s / 60;
  if (m < 60) {
    return { value: parseFloat(m.toFixed(2)).toString(), unit: 'm' };
  }
  const h = m / 60;
  if (h < 24) {
    return { value: parseFloat(h.toFixed(2)).toString(), unit: 'h' };
  }
  const d = h / 24;
  return { value: parseFloat(d.toFixed(2)).toString(), unit: 'd' };
};

const cards: StatCardConfig[] = [
  { key: 'totalRequests', label: 'Total Requests', icon: <BarChart3 className="w-4 h-4" />, colorClass: 'text-blue-500' },
  { key: 'success', label: 'Success (2xx)', icon: <CheckCircle2 className="w-4 h-4" />, colorClass: 'text-green-500' },
  { key: 'clientErrors', label: 'Client Errors (4xx)', icon: <AlertTriangle className="w-4 h-4" />, colorClass: 'text-orange-500' },
  { key: 'serverErrors', label: 'Server Errors (5xx)', icon: <XCircle className="w-4 h-4" />, colorClass: 'text-red-500' },
  {
    key: 'avgResponseTime',
    label: 'Avg Response Time',
    icon: <Timer className="w-4 h-4" />,
    colorClass: 'text-cyan-500',
    format: (v) => formatDuration(v).value,
    getUnit: (v) => formatDuration(v).unit,
  },
  {
    key: 'p95ResponseTime',
    label: 'P95 Response Time',
    icon: <TrendingUp className="w-4 h-4" />,
    colorClass: 'text-purple-500',
    format: (v) => formatDuration(v).value,
    getUnit: (v) => formatDuration(v).unit,
  },
  {
    key: 'reqPerSec',
    label: 'Req/s',
    icon: <Zap className="w-4 h-4" />,
    colorClass: 'text-yellow-500',
    format: (v) => parseFloat(v.toFixed(1)).toString(),
  },
  { key: 'failedChecks', label: 'Failed Checks', icon: <Ban className="w-4 h-4" />, colorClass: 'text-red-600' },
];

function formatNumber(val: number, formatter?: (v: number) => string): string {
  if (formatter) return formatter(val);
  return val.toString();
}

export default function StatisticsPanel({ metrics }: StatisticsPanelProps) {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4 px-4">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Real-time Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card key={card.key} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="px-4">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">
                    {card.label}
                  </p>
                  <div className={cn("p-2 rounded-lg bg-muted/50", card.colorClass)}>
                    {card.icon}
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {formatNumber(metrics[card.key], card.format)}
                  </div>
                  {(card.unit || (card.getUnit && card.getUnit(metrics[card.key]))) && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {card.unit || (card.getUnit && card.getUnit(metrics[card.key]))}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useCallback } from 'react';
import type { TestConfig } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings2, Play, Square, Plus, Trash2, Globe, Users, Clock, Braces, Layers, Target, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestConfigPanelProps {
  onStartTest: (config: TestConfig) => void;
  onStopTest: () => void;
  isRunning: boolean;
  timeLeft?: number;
  progressPercent?: number;
  className?: string;
}

export default function TestConfigPanel({ onStartTest, onStopTest, isRunning, timeLeft, progressPercent, className }: TestConfigPanelProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  const [config, setConfig] = useState<TestConfig>({
    url: '',
    method: 'GET',
    vus: 10,
    duration: '30s',
    headers: [{ key: '', value: '' }],
    body: '',
    stages: [{ duration: '10s', target: 5 }],
    thresholds: [{ key: 'http_req_duration', value: 'p(95)<500' }],
    useStages: false,
  });

  const updateField = useCallback(<K extends keyof TestConfig>(field: K, value: TestConfig[K]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = () => {
    if (!config.url.trim() || !config.vus) return;
    onStartTest(config);
  };

  // Header handlers
  const addHeader = () => setConfig(prev => ({ ...prev, headers: [...prev.headers, { key: '', value: '' }] }));
  const removeHeader = (i: number) => setConfig(prev => ({ ...prev, headers: prev.headers.filter((_, idx) => idx !== i) }));
  const updateHeader = (i: number, field: 'key' | 'value', val: string) => {
    setConfig(prev => {
      const h = [...prev.headers];
      h[i] = { ...h[i], [field]: val };
      return { ...prev, headers: h };
    });
  };

  // Stage handlers
  const addStage = () => setConfig(prev => ({ ...prev, stages: [...prev.stages, { duration: '10s', target: 10 }] }));
  const removeStage = (i: number) => setConfig(prev => ({ ...prev, stages: prev.stages.filter((_, idx) => idx !== i) }));
  const updateStage = (i: number, field: 'duration' | 'target', val: string | number) => {
    setConfig(prev => {
      const s = [...prev.stages];
      s[i] = { ...s[i], [field]: val };
      return { ...prev, stages: s };
    });
  };

  // Threshold handlers
  const addThreshold = () => setConfig(prev => ({ ...prev, thresholds: [...prev.thresholds, { key: '', value: '' }] }));
  const removeThreshold = (i: number) => setConfig(prev => ({ ...prev, thresholds: prev.thresholds.filter((_, idx) => idx !== i) }));
  const updateThreshold = (i: number, field: 'key' | 'value', val: string) => {
    setConfig(prev => {
      const t = [...prev.thresholds];
      t[i] = { ...t[i], [field]: val };
      return { ...prev, thresholds: t };
    });
  };

  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm flex flex-col", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Test Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Configure parameters for your K6 load test scenario.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full shrink-0">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isRunning || !config.url.trim() || !config.vus || Number(config.vus) <= 0}
              className="flex-1 gap-2 px-4 shadow-sm h-9"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="whitespace-nowrap">Start Test</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onStopTest}
              disabled={!isRunning}
              className="flex-1 gap-2 px-4 h-9"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="whitespace-nowrap">Stop Test</span>
            </Button>
          </div>
        </div>
        {isRunning && timeLeft !== undefined && progressPercent !== undefined && (
          <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-1">
            <div className="flex justify-between items-end mb-2">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Time Remaining</p>
                <p className="text-xl font-bold tabular-nums text-primary">{formatTime(timeLeft)}</p>
              </div>
              <p className="text-xs font-bold text-muted-foreground">{Math.round(progressPercent)}%</p>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-linear shadow-primary/40"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        {/* Main Row: URL & Method */}
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="w-full xl:w-fit space-y-2 shrink-0">
            <Label htmlFor="method">Method</Label>
            <Select
              value={config.method}
              onValueChange={(val) => updateField('method', val)}
              disabled={isRunning}
            >
              <SelectTrigger id="method" className="bg-background/50">
                <SelectValue placeholder="GET" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <Label htmlFor="url">Target URL</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/api/v1/resource"
                className="pl-9 bg-background/50"
                value={config.url}
                onChange={e => updateField('url', e.target.value)}
                disabled={isRunning}
              />
            </div>
          </div>
        </div>

        {/* Basic Params Row: VUs, Duration, Use Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="vus" className="text-xs font-semibold">Virtual Users (VUs)</Label>
            </div>
            <Input
              id="vus"
              type="number"
              className="bg-background/50 h-9"
              min={1}
              value={config.vus}
              onChange={e => updateField('vus', e.target.value)}
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <Label htmlFor="duration" className="text-xs font-semibold">Total Duration</Label>
            </div>
            <Input
              id="duration"
              placeholder="30s, 1m, 5m"
              className="bg-background/50 h-9"
              value={config.duration}
              onChange={e => updateField('duration', e.target.value)}
              disabled={isRunning}
            />
          </div>
          <div className="md:col-span-2 xl:col-span-1 2xl:col-span-2 flex items-center justify-between gap-4 pt-2 border-t border-border/50 md:border-none md:pt-0">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold">Execution Mode</Label>
              <div className="text-[10px] text-muted-foreground">Toggle between static VUs and ramp-up stages.</div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/20 border rounded-full shrink-0">
              <span
                className={cn("text-[10px] font-bold cursor-pointer select-none transition-opacity", !config.useStages ? "opacity-100" : "opacity-40")}
                onClick={() => !isRunning && updateField('useStages', false)}
              >
                Static
              </span>
              <Switch
                checked={config.useStages}
                onCheckedChange={(val) => updateField('useStages', val)}
                disabled={isRunning}
              />
              <span
                className={cn("text-[10px] font-bold cursor-pointer select-none transition-opacity", config.useStages ? "opacity-100" : "opacity-40")}
                onClick={() => !isRunning && updateField('useStages', true)}
              >
                Stages
              </span>
            </div>
          </div>
        </div>

        <Accordion type="multiple" className="w-full mt-auto">
          {/* Headers Section */}
          <AccordionItem value="headers" className="border-border/50">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Braces className="w-4 h-4 text-primary" />
                HTTP Headers
                {config.headers.filter(h => h.key.trim()).length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4">{config.headers.filter(h => h.key.trim()).length}</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              {config.headers.map((h, i) => (
                <div className="flex flex-col sm:flex-row gap-2 pb-3 sm:pb-0 border-b sm:border-none last:border-none" key={i}>
                  <Input
                    placeholder="Key (e.g. Authorization)"
                    className="h-9 text-xs w-full sm:w-1/2"
                    value={h.key}
                    onChange={e => updateHeader(i, 'key', e.target.value)}
                    disabled={isRunning}
                  />
                  <div className="flex gap-2 w-full sm:w-1/2">
                    <Input
                      placeholder="Value (e.g. Bearer ...)"
                      className="h-9 text-xs flex-1"
                      value={h.value}
                      onChange={e => updateHeader(i, 'value', e.target.value)}
                      disabled={isRunning}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive border sm:border-none"
                      onClick={() => removeHeader(i)}
                      disabled={isRunning}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-2 border-dashed"
                onClick={addHeader}
                disabled={isRunning}
              >
                <Plus className="w-3 h-3" />
                Add Header
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Body Section */}
          <AccordionItem value="body" className="border-border/50">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4 text-primary" />
                Request Body
                {config.body.trim() && <Badge variant="secondary" className="ml-1 text-[10px] h-4">JSON</Badge>}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <Textarea
                placeholder='{"key": "value"}'
                className="font-mono text-xs bg-muted/20 min-h-[120px]"
                value={config.body}
                onChange={e => updateField('body', e.target.value)}
                disabled={isRunning}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Stages Section (Only relevant if useStages is true, but we show it anyway) */}
          <AccordionItem value="stages" className="border-border/50">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-left">
                <Layers className="w-4 h-4 text-primary" />
                Ramp-up Stages
                {config.useStages && <Badge variant="default" className="ml-1 text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/10 h-4 border-green-500/20 uppercase tracking-tighter">Enabled</Badge>}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              {!config.useStages && (
                <p className="text-[11px] text-muted-foreground mb-2 italic px-1">Note: Execution Mode must be set to 'Stages' to use these.</p>
              )}
              <ScrollArea className={'h-[280px] pr-4'} type="always">
                <div className="space-y-3 pb-2">
                  {config.stages.map((s, i) => (
                    <div className="grid grid-cols-2 gap-2 relative group pr-10" key={i}>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground pl-1">Stage Duration</Label>
                        <Input
                          placeholder="10s"
                          className="h-9 text-xs"
                          value={s.duration}
                          onChange={e => updateStage(i, 'duration', e.target.value)}
                          disabled={isRunning}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground pl-1">Target VUs</Label>
                        <Input
                          type="number"
                          className="h-9 text-xs"
                          value={s.target}
                          onChange={e => updateStage(i, 'target', e.target.value)}
                          disabled={isRunning}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 bottom-0 h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => removeStage(i)}
                        disabled={isRunning}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-2 border-dashed"
                onClick={addStage}
                disabled={isRunning}
              >
                <Plus className="w-3 h-3" />
                Add Stage
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Thresholds Section */}
          <AccordionItem value="thresholds" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4 text-primary" />
                Test Thresholds
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-2 space-y-3">
              <ScrollArea className={'h-[240px] pr-4'} type="always">
                <div className="space-y-3 pb-2">
                  {config.thresholds.map((t, i) => (
                    <div className="flex flex-col sm:flex-row gap-2 pb-3 sm:pb-0 border-b sm:border-none last:border-none" key={i}>
                      <Input
                        placeholder="Metric (e.g. http_req_duration)"
                        className="h-9 text-xs w-full sm:w-[55%]"
                        value={t.key}
                        onChange={e => updateThreshold(i, 'key', e.target.value)}
                        disabled={isRunning}
                      />
                      <div className="flex gap-2 w-full sm:w-[45%]">
                        <Input
                          placeholder="Rule (e.g. p(95)<500)"
                          className="h-9 text-xs flex-1"
                          value={t.value}
                          onChange={e => updateThreshold(i, 'value', e.target.value)}
                          disabled={isRunning}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive border sm:border-none"
                          onClick={() => removeThreshold(i)}
                          disabled={isRunning}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-2 border-dashed"
                onClick={addThreshold}
                disabled={isRunning}
              >
                <Plus className="w-3 h-3" />
                Add Threshold
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card >
  );
}

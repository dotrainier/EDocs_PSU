'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, Clock, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardInsight {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  body: string;
  action: string | null;
  link: string | null;
}

interface InsightsResult {
  insights: DashboardInsight[];
  ai_failed: boolean;
}

interface DashboardData {
  role: string;
  stats: { total_pending: number; on_track: number; at_risk: number; breached: number };
  slaWeeklyTrend: Array<{ week: string; onTrack: number; atRisk: number; breached: number }>;
  processingTime: Array<{ docType: string; target: number; actual: number }>;
  tasks: Array<{
    tracking_number: string;
    document_type: string;
    sla_status: string;
    sla_due_at: string | null;
  }>;
  clearancePerformance: Array<{ office: string; cleared: number; pending: number; rejected: number }>;
  myStats: { my_cleared: number; my_rejected: number; my_pending: number };
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    Icon: AlertTriangle,
    bar: 'bg-red-500',
    iconClass: 'text-red-500',
    bg: 'bg-red-50 border-red-100',
    actionClass: 'text-red-600',
  },
  warning: {
    Icon: Clock,
    bar: 'bg-amber-500',
    iconClass: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-100',
    actionClass: 'text-amber-600',
  },
  info: {
    Icon: Info,
    bar: 'bg-blue-500',
    iconClass: 'text-blue-500',
    bg: 'bg-blue-50 border-blue-100',
    actionClass: 'text-blue-600',
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function AiInsights({ data }: { data: DashboardData | null }) {
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchInsights = useCallback(async () => {
    if (!data) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/office/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: data.role,
          stats: data.stats,
          slaWeeklyTrend: data.slaWeeklyTrend,
          processingTime: data.processingTime,
          tasks: data.tasks,
          clearancePerformance: data.clearancePerformance,
          myStats: data.myStats,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate insights');
      const result: InsightsResult = await res.json();
      if (result.ai_failed) throw new Error('AI service unavailable');
      setInsights(result.insights);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (data && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchInsights();
    }
  }, [data, fetchInsights]);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-3'>
        <div>
          <CardTitle className='font-sans flex items-center gap-2 text-base font-semibold'>
            <Sparkles className='h-4 w-4 text-violet-500' />
            AI Insights
          </CardTitle>
          <p className='font-sans mt-1 text-xs text-muted-foreground'>
            Prioritized recommendations powered by Gemini
          </p>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={fetchInsights}
          disabled={loading || !data}
          className='gap-1.5 text-xs'
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          {loading ? 'Generating...' : 'Refresh'}
        </Button>
      </CardHeader>

      <CardContent className='pt-0'>
        {loading && (
          <div className='space-y-2.5'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='flex gap-3 rounded-lg border p-3 animate-pulse'>
                <div className='mt-1 h-3 w-0.5 rounded-full bg-muted' />
                <div className='h-4 w-4 rounded bg-muted shrink-0' />
                <div className='flex-1 space-y-1.5'>
                  <div className='h-3.5 w-2/3 rounded bg-muted' />
                  <div className='h-3 w-full rounded bg-muted' />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className='flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
            <AlertTriangle className='h-4 w-4 shrink-0' />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && insights.length === 0 && lastFetched && (
          <p className='font-sans py-4 text-center text-sm text-muted-foreground'>
            No insights available at this time.
          </p>
        )}

        {!loading && !error && insights.length > 0 && (
          <div className='space-y-2.5'>
            {insights.map((insight, i) => {
              const cfg = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.info;
              const { Icon } = cfg;
              return (
                <div key={i} className={cn('flex gap-3 rounded-lg border p-3', cfg.bg)}>
                  <div className={cn('mt-1 h-full w-0.5 shrink-0 rounded-full self-stretch min-h-10', cfg.bar)} />
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', cfg.iconClass)} />
                  <div className='min-w-0 flex-1'>
                    <p className='font-sans text-sm font-semibold text-foreground'>{insight.title}</p>
                    <p className='font-sans mt-0.5 text-xs text-muted-foreground'>{insight.body}</p>
                    {insight.action && (
                      insight.link ? (
                        <Link
                          href={insight.link}
                          className={cn('font-sans mt-1.5 inline-flex items-center gap-1 text-xs font-medium hover:underline', cfg.actionClass)}
                        >
                          {insight.action}
                          <ArrowRight className='h-3 w-3' />
                        </Link>
                      ) : (
                        <p className={cn('font-sans mt-1.5 text-xs font-medium', cfg.actionClass)}>
                          → {insight.action}
                        </p>
                      )
                    )}
                  </div>
                </div>
              );
            })}
            {lastFetched && (
              <p className='font-sans pt-1 text-right text-[11px] text-muted-foreground'>
                Generated {lastFetched.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

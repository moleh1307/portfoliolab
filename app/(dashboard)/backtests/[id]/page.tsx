'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricGridSkeleton, Skeleton } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { PortfolioValueChart } from '@/components/charts/portfolio-value-chart';
import { CumulativeReturnChart } from '@/components/charts/cumulative-return-chart';
import { DrawdownChart } from '@/components/charts/drawdown-chart';
import { useToast } from '@/components/ui/toast';
import { confirmDialog } from '@/components/ui/alert-dialog';

interface BacktestPoint {
  id: string;
  date: string;
  portfolioValue: number;
  portfolioReturn: number;
  drawdown: number;
}

interface Holding {
  assetId: string;
  weight: number;
  asset: { id: string; symbol: string; displayName: string | null };
}

interface Portfolio {
  id: string;
  name: string;
  holdings: Holding[];
}

interface Backtest {
  id: string;
  portfolioId: string;
  portfolio: Portfolio;
  startDate: string;
  endDate: string;
  rebalanceFrequency: string;
  initialCapital: number;
  status: string;
  summaryMetrics: string;
  createdAt: string;
  dataPoints: BacktestPoint[];
}

interface SummaryMetrics {
  totalReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bestDay: number;
  worstDay: number;
  numberOfObservations: number;
}

function MetricTile({ label, value, positive, subtext }: { label: string; value: string; positive?: boolean; subtext?: string }) {
  return (
    <div className="px-5 py-4">
      <p className="metric-label mb-2">{label}</p>
      <p className={`text-[20px] font-semibold font-mono tracking-tight tabular-nums leading-none ${
        positive !== undefined ? (positive ? 'text-positive' : 'text-negative') : ''
      }`}>
        {value}
      </p>
      {subtext && <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-mono tabular-nums">{subtext}</p>}
    </div>
  );
}

export default function BacktestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [backtest, setBacktest] = useState<Backtest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllReturns, setShowAllReturns] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBacktest = useCallback(async () => {
    try {
      const response = await fetch(`/api/backtests/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setBacktest(data.backtest);
      } else if (response.status === 404) {
        setError('Backtest not found');
      }
    } catch (err) {
      setError('Failed to load backtest');
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchBacktest();
  }, [fetchBacktest]);

  const formatMetrics = (metricsJson: string | null): SummaryMetrics | null => {
    if (!metricsJson) return null;
    try {
      return JSON.parse(metricsJson);
    } catch {
      return null;
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog('Delete backtest', `This will permanently delete "${backtest?.portfolio.name}" and all its data.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/backtests/${params.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast('Backtest deleted', 'success');
        router.push('/backtests');
      } else {
        toast('Failed to delete backtest', 'error');
      }
    } catch {
      toast('Failed to delete backtest', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <MetricGridSkeleton />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !backtest) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2 text-[13px]" onClick={() => router.push('/backtests')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </Button>
        <div className="rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-[13px] text-muted-foreground">{error || 'Backtest not found'}</p>
        </div>
      </div>
    );
  }

  const metrics = formatMetrics(backtest.summaryMetrics);
  const chartData = backtest.dataPoints.map((dp) => ({
    date: new Date(dp.date).toISOString().split('T')[0],
    value: dp.portfolioValue,
    cumulativeReturn: (dp.portfolioValue - backtest.initialCapital) / backtest.initialCapital,
    drawdown: dp.drawdown,
  }));

  const totalReturnPct = metrics ? metrics.totalReturn * 100 : 0;
  const isPositive = totalReturnPct >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 text-[13px]" onClick={() => router.push('/backtests')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-[11px] text-muted-foreground hover:text-negative"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>

      {metrics && (
        <div className="hero-metric shadow-hero animate-fade-in-up">
          <div className="flex items-start justify-between relative">
            <div>
              <p className="hero-metric-label">Total Return</p>
              <p className={`hero-metric-value ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                <AnimatedNumber
                  value={totalReturnPct}
                  decimals={2}
                  suffix="%"
                  duration={1000}
                />
              </p>
              <p className="hero-metric-sub">
                {metrics.numberOfObservations.toLocaleString()} trading days &middot; {(metrics.annualizedReturn * 100).toFixed(2)}% annualized
              </p>
            </div>
            <div className="flex items-center gap-3 relative">
              <span
                className={`status-badge ${
                  backtest.status === 'completed'
                    ? 'status-badge-completed'
                    : backtest.status === 'partial'
                    ? 'status-badge-running'
                    : 'status-badge-pending'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  backtest.status === 'completed' ? 'bg-positive' :
                  backtest.status === 'partial' ? 'bg-amber-500' : 'bg-muted-foreground'
                }`} />
                {backtest.status === 'completed' ? 'Completed' : backtest.status === 'partial' ? 'Partial' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 -mt-1">
        <h1 className="page-title">{backtest.portfolio.name}</h1>
      </div>
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground/70 -mt-1">
        <span className="font-mono tabular-nums">
          {new Date(backtest.startDate).toLocaleDateString()} &ndash; {new Date(backtest.endDate).toLocaleDateString()}
        </span>
        <span className="text-border/40">&middot;</span>
        <span>{backtest.rebalanceFrequency === 'none' ? 'No rebalancing' : `${backtest.rebalanceFrequency} rebalancing`}</span>
        <span className="text-border/40">&middot;</span>
        <span className="font-mono tabular-nums">${backtest.initialCapital.toLocaleString()} initial</span>
      </div>

      {metrics && (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/40">
            <MetricTile
              label="Ann. Return"
              value={`${(metrics.annualizedReturn * 100).toFixed(2)}%`}
              positive={metrics.annualizedReturn >= 0}
            />
            <MetricTile
              label="Sharpe"
              value={metrics.sharpeRatio.toFixed(2)}
            />
            <MetricTile
              label="Ann. Vol"
              value={`${(metrics.annualizedVolatility * 100).toFixed(2)}%`}
            />
            <MetricTile
              label="Max DD"
              value={`${(metrics.maxDrawdown * 100).toFixed(2)}%`}
              positive={false}
            />
          </div>
          <div className="border-t border-border/40" />
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/40">
            <MetricTile
              label="Best Day"
              value={`+${(metrics.bestDay * 100).toFixed(2)}%`}
              positive={true}
            />
            <MetricTile
              label="Worst Day"
              value={`${(metrics.worstDay * 100).toFixed(2)}%`}
              positive={false}
            />
            <MetricTile
              label="Observations"
              value={metrics.numberOfObservations.toLocaleString()}
            />
            <MetricTile
              label="End Value"
              value={`$${(backtest.initialCapital * (1 + metrics.totalReturn)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            />
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <PortfolioValueChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Return</CardTitle>
          </CardHeader>
          <CardContent>
            <CumulativeReturnChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DrawdownChart data={chartData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted mb-4">
            {backtest.portfolio.holdings.map((holding, i) => {
              const colors = [
                'hsl(var(--chart-1))',
                'hsl(var(--chart-2))',
                'hsl(var(--chart-4))',
                'hsl(var(--chart-5))',
                'hsl(var(--muted-foreground))',
              ];
              return (
                <div
                  key={holding.assetId}
                  className="h-full transition-all"
                  style={{
                    width: `${holding.weight}%`,
                    backgroundColor: colors[i % colors.length],
                  }}
                />
              );
            })}
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="table-header text-left py-2">Symbol</th>
                <th className="table-header text-right py-2">Weight</th>
              </tr>
            </thead>
            <tbody>
              {backtest.portfolio.holdings.map((holding) => (
                <tr key={holding.assetId} className="border-b border-border/20 last:border-0 transition-colors hover:bg-muted/20">
                  <td className="py-2.5">
                    <span className="font-mono font-medium text-[13px]">{holding.asset.symbol}</span>
                    {holding.asset.displayName && (
                      <span className="text-muted-foreground ml-1.5 text-[11px]">
                        {holding.asset.displayName}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono text-[13px] tabular-nums">{holding.weight.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Daily Returns</CardTitle>
          {backtest.dataPoints.length > 30 && (
            <button
              onClick={() => setShowAllReturns(!showAllReturns)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {showAllReturns ? 'Show recent' : `Show all (${backtest.dataPoints.length})`}
            </button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="table-header text-left py-2">Date</th>
                  <th className="table-header text-right py-2">Value</th>
                  <th className="table-header text-right py-2">Return</th>
                  <th className="table-header text-right py-2">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {(showAllReturns ? backtest.dataPoints : backtest.dataPoints.slice(-30)).map((dp) => (
                  <tr key={dp.id} className="border-b border-border/20 last:border-0 transition-colors hover:bg-muted/20">
                    <td className="py-2 font-mono text-xs tabular-nums">{new Date(dp.date).toLocaleDateString()}</td>
                    <td className="py-2 text-right font-mono text-xs tabular-nums">
                      ${dp.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2 text-right font-mono text-xs tabular-nums ${dp.portfolioReturn >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {(dp.portfolioReturn * 100).toFixed(2)}%
                    </td>
                    <td className={`py-2 text-right font-mono text-xs tabular-nums ${(dp.portfolioValue - backtest.initialCapital) / backtest.initialCapital >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {(((dp.portfolioValue - backtest.initialCapital) / backtest.initialCapital) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAllReturns && backtest.dataPoints.length > 30 && (
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              Showing 30 most recent of {backtest.dataPoints.length} days
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

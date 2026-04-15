'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparisonChart } from '@/components/charts/comparison-chart';

interface Backtest {
  id: string;
  portfolioId: string;
  portfolio: { id: string; name: string };
  startDate: string;
  endDate: string;
  rebalanceFrequency: string;
  initialCapital: number;
  status: string;
  summaryMetrics: string;
  createdAt: string;
  dataPoints: { date: string; portfolioValue: number }[];
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

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function ComparisonPage() {
  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBacktests = useCallback(async () => {
    try {
      const response = await fetch('/api/backtests');
      if (response.ok) {
        const data = await response.json();
        setBacktests(data.backtests);
      }
    } catch (error) {
      console.error('Failed to fetch backtests:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBacktests();
  }, [fetchBacktests]);

  const maxSelections = 5;

  const toggleBacktest = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= maxSelections) return prev;
      return [...prev, id];
    });
  };

  const clearSelections = () => setSelectedIds([]);

  const formatMetrics = (metricsJson: string | null): SummaryMetrics | null => {
    if (!metricsJson) return null;
    try {
      return JSON.parse(metricsJson);
    } catch {
      return null;
    }
  };

  const selectedBacktests = backtests.filter((bt) => selectedIds.includes(bt.id));

  const chartData = () => {
    if (selectedBacktests.length === 0) return [];

    const allDates = new Set<string>();
    for (const bt of selectedBacktests) {
      for (const dp of bt.dataPoints) {
        allDates.add(new Date(dp.date).toISOString().split('T')[0]);
      }
    }

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map((date) => {
      const point: { date: string; [key: string]: string | number } = { date };
      for (const bt of selectedBacktests) {
        const initialValue = bt.initialCapital;
        const dp = bt.dataPoints.find(
          (p) => new Date(p.date).toISOString().split('T')[0] === date
        );
        if (dp) {
          const cumulativeReturn = (dp.portfolioValue - initialValue) / initialValue;
          point[bt.id] = cumulativeReturn;
        }
      }
      return point;
    });
  };

  const chartLines = selectedBacktests.map((bt, index) => ({
    key: bt.id,
    name: bt.portfolio.name,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const metricsRows: { key: string; label: string; format: (m: SummaryMetrics) => string; className?: string | ((m: SummaryMetrics) => string) }[] = [
    { key: 'totalReturn', label: 'Total Return', format: (m) => `${(m.totalReturn * 100).toFixed(2)}%`, className: (m: SummaryMetrics) => m.totalReturn >= 0 ? 'text-positive' : 'text-negative' },
    { key: 'annualizedReturn', label: 'Annualized Return', format: (m) => `${(m.annualizedReturn * 100).toFixed(2)}%`, className: (m: SummaryMetrics) => m.annualizedReturn >= 0 ? 'text-positive' : 'text-negative' },
    { key: 'annualizedVolatility', label: 'Annualized Volatility', format: (m) => `${(m.annualizedVolatility * 100).toFixed(2)}%` },
    { key: 'sharpeRatio', label: 'Sharpe Ratio', format: (m) => m.sharpeRatio.toFixed(2) },
    { key: 'maxDrawdown', label: 'Max Drawdown', format: (m) => `${(m.maxDrawdown * 100).toFixed(2)}%`, className: 'text-negative' },
    { key: 'bestDay', label: 'Best Day', format: (m) => `+${(m.bestDay * 100).toFixed(2)}%`, className: 'text-positive' },
    { key: 'worstDay', label: 'Worst Day', format: (m) => `${(m.worstDay * 100).toFixed(2)}%`, className: 'text-negative' },
    { key: 'observations', label: 'Observations', format: (m) => m.numberOfObservations.toLocaleString(), className: 'text-muted-foreground' },
  ];

  return (
    <div>
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Compare</h1>
          <p className="page-description">
            Compare performance across multiple backtests side by side.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Backtests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex gap-1.5">
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            ) : backtests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <p className="text-[13px] text-muted-foreground">No backtests available. Run some backtests first.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {backtests.map((backtest) => {
                    const isSelected = selectedIds.includes(backtest.id);
                    const isDisabled = !isSelected && selectedIds.length >= maxSelections;
                    return (
                      <button
                        key={backtest.id}
                        onClick={() => toggleBacktest(backtest.id)}
                        disabled={isDisabled}
                        aria-pressed={isSelected}
                        className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-all duration-150 border ${
                          isSelected
                            ? 'bg-foreground text-background border-foreground'
                            : isDisabled
                            ? 'bg-muted/50 text-muted-foreground/40 border-border cursor-not-allowed'
                            : 'bg-transparent text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {backtest.portfolio.name}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {selectedIds.length > 0 ? `${selectedIds.length} of ${maxSelections} selected` : `Select up to ${maxSelections}`}
                  </span>
                  {selectedIds.length > 0 && (
                    <button
                      onClick={clearSelections}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedBacktests.length >= 2 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Returns</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ComparisonChart data={chartData()} lines={chartLines} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metrics Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="table-header text-left py-2.5 pr-6">Metric</th>
                        {selectedBacktests.map((bt, index) => (
                          <th
                            key={bt.id}
                            className="table-header text-right py-2.5 pl-4 font-mono"
                            style={{ color: CHART_COLORS[index % CHART_COLORS.length] }}
                          >
                            {bt.portfolio.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metricsRows.map((row) => (
                        <tr key={row.key} className="border-b border-border/40 last:border-0">
                          <td className="py-2 text-[13px] font-medium">{row.label}</td>
                          {selectedBacktests.map((bt) => {
                            const metrics = formatMetrics(bt.summaryMetrics);
                            if (!metrics) return <td key={bt.id} className="py-2 text-right font-mono text-xs tabular-nums">-</td>;
                            const cellClass = typeof row.className === 'function' ? row.className(metrics) : (row.className || '');
                            return (
                              <td key={bt.id} className={`py-2 text-right font-mono text-xs tabular-nums ${cellClass}`}>
                                {row.format(metrics)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {selectedBacktests.length > 0 && selectedBacktests.length < 2 && (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
              Select at least one more backtest to compare
            </p>
          </div>
        )}

        {selectedIds.length === 0 && backtests.length > 0 && (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <p className="text-[13px] text-muted-foreground">Select backtests above to begin comparing performance.</p>
          </div>
        )}
      </div>
    </div>
  );
}
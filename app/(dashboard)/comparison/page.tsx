'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const CHART_COLORS = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#d97706'];

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

  const toggleBacktest = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare Backtests</h1>
        <p className="text-muted-foreground">
          Select multiple backtests to compare their performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Backtests</CardTitle>
          <CardDescription>Choose 2 or more backtests to compare</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : backtests.length === 0 ? (
            <p className="text-muted-foreground">
              No backtests yet. Run some backtests first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {backtests.map((backtest) => {
                const isSelected = selectedIds.includes(backtest.id);
                return (
                  <Button
                    key={backtest.id}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleBacktest(backtest.id)}
                  >
                    {backtest.portfolio.name}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBacktests.length >= 2 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>Cumulative returns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ComparisonChart data={chartData()} lines={chartLines} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics Comparison</CardTitle>
              <CardDescription>Side-by-side performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Metric</th>
                      {selectedBacktests.map((bt) => (
                        <th
                          key={bt.id}
                          className="text-right py-3 px-2"
                          style={{
                            color: CHART_COLORS[selectedBacktests.indexOf(bt) % CHART_COLORS.length],
                          }}
                        >
                          {bt.portfolio.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-2 font-medium">Total Return</td>
                      {selectedBacktests.map((bt) => {
                        const metrics = formatMetrics(bt.summaryMetrics);
                        return (
                          <td
                            key={bt.id}
                            className={`py-2 px-2 text-right ${
                              (metrics?.totalReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {metrics ? `${(metrics.totalReturn * 100).toFixed(2)}%` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 font-medium">Annualized Return</td>
                      {selectedBacktests.map((bt) => {
                        const metrics = formatMetrics(bt.summaryMetrics);
                        return (
                          <td
                            key={bt.id}
                            className={`py-2 px-2 text-right ${
                              (metrics?.annualizedReturn || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {metrics ? `${(metrics.annualizedReturn * 100).toFixed(2)}%` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 font-medium">Annualized Volatility</td>
                      {selectedBacktests.map((bt) => {
                        const metrics = formatMetrics(bt.summaryMetrics);
                        return (
                          <td key={bt.id} className="py-2 px-2 text-right">
                            {metrics ? `${(metrics.annualizedVolatility * 100).toFixed(2)}%` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 font-medium">Sharpe Ratio</td>
                      {selectedBacktests.map((bt) => {
                        const metrics = formatMetrics(bt.summaryMetrics);
                        return (
                          <td key={bt.id} className="py-2 px-2 text-right">
                            {metrics ? metrics.sharpeRatio.toFixed(2) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 font-medium">Max Drawdown</td>
                      {selectedBacktests.map((bt) => {
                        const metrics = formatMetrics(bt.summaryMetrics);
                        return (
                          <td key={bt.id} className="py-2 px-2 text-right text-red-600">
                            {metrics ? `${(metrics.maxDrawdown * 100).toFixed(2)}%` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 font-medium">Best Day</td>
                      {selectedBacktests.map((bt) => {
                        const metrics = formatMetrics(bt.summaryMetrics);
                        return (
                          <td key={bt.id} className="py-2 px-2 text-right text-green-600">
                            {metrics ? `${(metrics.bestDay * 100).toFixed(2)}%` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-2 font-medium">Worst Day</td>
                      {selectedBacktests.map((bt) => {
                        const metrics = formatMetrics(bt.summaryMetrics);
                        return (
                          <td key={bt.id} className="py-2 px-2 text-right text-red-600">
                            {metrics ? `${(metrics.worstDay * 100).toFixed(2)}%` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-medium">Observations</td>
                      {selectedBacktests.map((bt) => {
                        const metrics = formatMetrics(bt.summaryMetrics);
                        return (
                          <td key={bt.id} className="py-2 px-2 text-right">
                            {metrics ? metrics.numberOfObservations.toLocaleString() : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedBacktests.length > 0 && selectedBacktests.length < 2 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Select at least 2 backtests to compare
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

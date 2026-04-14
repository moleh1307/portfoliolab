'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Portfolio {
  id: string;
  name: string;
  holdings: { assetId: string; weight: number; asset: { symbol: string } }[];
}

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
}

export default function BacktestsPage() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [backtests, setBacktests] = useState<Backtest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rebalanceFrequency, setRebalanceFrequency] = useState('monthly');
  const [initialCapital, setInitialCapital] = useState('10000');

  const fetchPortfolios = useCallback(async () => {
    try {
      const response = await fetch('/api/portfolios');
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data.portfolios);
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    }
  }, []);

  const fetchBacktests = useCallback(async () => {
    try {
      const response = await fetch('/api/backtests');
      if (response.ok) {
        const data = await response.json();
        setBacktests(data.backtests);
      }
    } catch (error) {
      console.error('Failed to fetch backtests:', error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPortfolios(), fetchBacktests()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchPortfolios, fetchBacktests]);

  const resetForm = () => {
    setSelectedPortfolioId('');
    setStartDate('');
    setEndDate('');
    setRebalanceFrequency('monthly');
    setInitialCapital('10000');
    setFormError('');
    setFormSuccess('');
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedPortfolioId) {
      setFormError('Select a portfolio');
      return;
    }

    if (!startDate || !endDate) {
      setFormError('Select start and end dates');
      return;
    }

    if (startDate >= endDate) {
      setFormError('Start date must be before end date');
      return;
    }

    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital <= 0) {
      setFormError('Initial capital must be positive');
      return;
    }

    setIsRunning(true);

    try {
      const response = await fetch('/api/backtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: selectedPortfolioId,
          startDate,
          endDate,
          rebalanceFrequency,
          initialCapital: capital,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run backtest');
      }

      const { backtest } = await response.json();
      setFormSuccess('Backtest complete');
      fetchBacktests();
      setTimeout(() => {
        router.push(`/backtests/${backtest.id}`);
      }, 1000);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to run backtest');
    } finally {
      setIsRunning(false);
    }
  };

  const formatMetrics = (metricsJson: string | null) => {
    if (!metricsJson) return null;
    try {
      return JSON.parse(metricsJson);
    } catch {
      return null;
    }
  };

  return (
    <div>
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Backtests</h1>
          <p className="page-description">
            Run historical simulations to evaluate portfolio performance.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Run Backtest
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Configure</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="portfolio">Portfolio</Label>
                  <select
                    id="portfolio"
                    className="flex h-8 w-full rounded-md border border-border bg-background px-3 py-1.5 text-[13px] text-foreground transition-colors focus-visible:border-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20"
                    value={selectedPortfolioId}
                    onChange={(e) => setSelectedPortfolioId(e.target.value)}
                  >
                    <option value="">Select a portfolio</option>
                    {portfolios.map((portfolio) => (
                      <option key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rebalance">Rebalance</Label>
                    <select
                      id="rebalance"
                      className="flex h-8 w-full rounded-md border border-border bg-background px-3 py-1.5 text-[13px] text-foreground transition-colors focus-visible:border-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20"
                      value={rebalanceFrequency}
                      onChange={(e) => setRebalanceFrequency(e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="capital">Initial Capital ($)</Label>
                    <Input
                      id="capital"
                      type="number"
                      min="1"
                      step="100"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(e.target.value)}
                      required
                      className="font-mono tabular-nums"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="rounded-md bg-negative/5 border border-negative/15 px-3 py-2.5 text-[13px] text-negative">
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="rounded-md bg-positive/5 border border-positive/15 px-3 py-2.5 text-[13px] text-positive">
                    {formSuccess}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button type="submit" disabled={isRunning}>
                    {isRunning ? 'Running...' : 'Run Backtest'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="section-title mb-3">History</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-16 rounded-lg border border-border animate-pulse-subtle bg-muted/30" />
              ))}
            </div>
          ) : backtests.length === 0 && !showForm ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 py-16 text-center">
              <p className="text-[13px] text-muted-foreground">No backtests yet. Run your first backtest above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backtests.map((backtest) => {
                const metrics = formatMetrics(backtest.summaryMetrics);
                return (
                  <div
                    key={backtest.id}
                    className="group flex items-start justify-between rounded-lg border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/backtests/${backtest.id}`)}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[13px] font-medium">{backtest.portfolio.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span className="font-mono tabular-nums">
                          {new Date(backtest.startDate).toLocaleDateString()} &ndash; {new Date(backtest.endDate).toLocaleDateString()}
                        </span>
                        <span className="text-border/60">&middot;</span>
                        <span>{backtest.rebalanceFrequency === 'none' ? 'No rebalance' : backtest.rebalanceFrequency}</span>
                        <span className="text-border/60">&middot;</span>
                        <span className="font-mono tabular-nums">${backtest.initialCapital.toLocaleString()}</span>
                      </div>
                      {metrics && (
                        <div className="flex items-center gap-3 mt-2 text-[11px] font-mono tabular-nums">
                          <span className={metrics.totalReturn >= 0 ? 'text-positive' : 'text-negative'}>
                            {(metrics.totalReturn * 100).toFixed(2)}%
                          </span>
                          <span className="text-muted-foreground">
                            Sharpe {metrics.sharpeRatio.toFixed(2)}
                          </span>
                          <span className="text-negative">
                            DD {(metrics.maxDrawdown * 100).toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); router.push(`/backtests/${backtest.id}`); }}
                    >
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
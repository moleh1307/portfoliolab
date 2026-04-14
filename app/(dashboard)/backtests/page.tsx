'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
      setFormError('Please select a portfolio');
      return;
    }

    if (!startDate || !endDate) {
      setFormError('Please select start and end dates');
      return;
    }

    if (startDate >= endDate) {
      setFormError('Start date must be before end date');
      return;
    }

    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital <= 0) {
      setFormError('Initial capital must be a positive number');
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
      setFormSuccess('Backtest completed successfully!');
      fetchBacktests();
      setTimeout(() => {
        router.push(`/backtests/${backtest.id}`);
      }, 1500);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backtests</h1>
          <p className="text-muted-foreground">
            Run portfolio backtests to analyze historical performance
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Run Backtest</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Backtest</CardTitle>
            <CardDescription>
              Select a portfolio and configure the backtest parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio</Label>
                <select
                  id="portfolio"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedPortfolioId}
                  onChange={(e) => setSelectedPortfolioId(e.target.value)}
                >
                  <option value="">Select a portfolio</option>
                  {portfolios.map((portfolio) => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name} ({portfolio.holdings.length} holdings)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
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

              <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rebalance">Rebalance Frequency</Label>
                <select
                  id="rebalance"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={rebalanceFrequency}
                  onChange={(e) => setRebalanceFrequency(e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="capital">Initial Capital ($)</Label>
                  <Input
                    id="capital"
                    type="number"
                    min="1"
                    step="100"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(e.target.value)}
                    required
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="rounded-md bg-green-600/10 p-3 text-sm text-green-600">
                  {formSuccess}
                </div>
              )}

              <div className="flex gap-2">
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

      <Card>
        <CardHeader>
          <CardTitle>Backtest History</CardTitle>
          <CardDescription>Previously run backtests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : backtests.length === 0 && !showForm ? (
            <p className="text-muted-foreground">
              No backtests yet. Run your first backtest above.
            </p>
          ) : (
            <div className="space-y-4">
              {backtests.map((backtest) => {
                const metrics = formatMetrics(backtest.summaryMetrics);
                return (
                  <div
                    key={backtest.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">{backtest.portfolio.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(backtest.startDate).toLocaleDateString()} - {new Date(backtest.endDate).toLocaleDateString()}
                        {' • '}
                        {backtest.rebalanceFrequency === 'none' ? 'No rebalancing' : `${backtest.rebalanceFrequency} rebalancing`}
                        {' • '}
                        ${backtest.initialCapital.toLocaleString()} initial
                      </p>
                      {metrics && (
                        <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
                          <span>Return: {(metrics.totalReturn * 100).toFixed(2)}%</span>
                          <span>Sharpe: {metrics.sharpeRatio.toFixed(2)}</span>
                          <span>Max DD: {(metrics.maxDrawdown * 100).toFixed(2)}%</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/backtests/${backtest.id}`)}
                    >
                      View Results
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

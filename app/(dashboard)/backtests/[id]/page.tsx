'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PortfolioValueChart } from '@/components/charts/portfolio-value-chart';
import { CumulativeReturnChart } from '@/components/charts/cumulative-return-chart';
import { DrawdownChart } from '@/components/charts/drawdown-chart';

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

export default function BacktestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [backtest, setBacktest] = useState<Backtest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !backtest) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.push('/backtests')}>
          ← Back to Backtests
        </Button>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{error || 'Backtest not found'}</p>
          </CardContent>
        </Card>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/backtests')}>
            ← Back
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{backtest.portfolio.name}</h1>
        <p className="text-muted-foreground">
          {new Date(backtest.startDate).toLocaleDateString()} - {new Date(backtest.endDate).toLocaleDateString()}
          {' • '}
          {backtest.rebalanceFrequency === 'none' ? 'No rebalancing' : `${backtest.rebalanceFrequency} rebalancing`}
          {' • '}
          ${backtest.initialCapital.toLocaleString()} initial
        </p>
      </div>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(metrics.totalReturn * 100).toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Annualized Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(metrics.annualizedReturn * 100).toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Volatility (Ann.)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.annualizedVolatility * 100).toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sharpe Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.sharpeRatio.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(metrics.maxDrawdown * 100).toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Best Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(metrics.bestDay * 100).toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Worst Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(metrics.worstDay * 100).toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Observations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.numberOfObservations.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
          <CardDescription>Portfolio value over time</CardDescription>
        </CardHeader>
        <CardContent>
          <PortfolioValueChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cumulative Return</CardTitle>
          <CardDescription>Total return since start of backtest</CardDescription>
        </CardHeader>
        <CardContent>
          <CumulativeReturnChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drawdown</CardTitle>
          <CardDescription>Portfolio drawdown from peak</CardDescription>
        </CardHeader>
        <CardContent>
          <DrawdownChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
          <CardDescription>Target portfolio weights</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Symbol</th>
                <th className="text-right py-2">Weight</th>
              </tr>
            </thead>
            <tbody>
              {backtest.portfolio.holdings.map((holding) => (
                <tr key={holding.assetId} className="border-b last:border-0">
                  <td className="py-2">
                    <span className="font-medium">{holding.asset.symbol}</span>
                    {holding.asset.displayName && (
                      <span className="text-muted-foreground ml-2">
                        {holding.asset.displayName}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right">{holding.weight.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Returns</CardTitle>
          <CardDescription>Last 30 days of returns</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-right py-2">Value</th>
                <th className="text-right py-2">Daily Return</th>
                <th className="text-right py-2">Cumulative Return</th>
              </tr>
            </thead>
            <tbody>
              {backtest.dataPoints.slice(-30).map((dp) => (
                <tr key={dp.id} className="border-b last:border-0">
                  <td className="py-2">{new Date(dp.date).toLocaleDateString()}</td>
                  <td className="py-2 text-right">
                    ${dp.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`py-2 text-right ${dp.portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(dp.portfolioReturn * 100).toFixed(2)}%
                  </td>
                  <td className={`py-2 text-right ${(dp.portfolioValue - backtest.initialCapital) / backtest.initialCapital >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(((dp.portfolioValue - backtest.initialCapital) / backtest.initialCapital) * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

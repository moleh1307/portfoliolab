'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { PortfolioOptimizer } from '@/components/charts/portfolio-optimizer';

interface Asset {
  id: string;
  symbol: string;
  displayName: string | null;
}

interface OptimizationData {
  minimumVariance: {
    weights: number[];
    symbols: string[];
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
  maximumSharpe: {
    weights: number[];
    symbols: string[];
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
  efficientFrontier: {
    volatility: number;
    expectedReturn: number;
    sharpeRatio: number;
    weights: number[];
  }[];
  symbols: string[];
}

export default function OptimizerPage() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [result, setResult] = useState<OptimizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState('');

  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets);
      }
    } catch {
      toast('Failed to load assets', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleOptimize = async () => {
    if (selectedAssets.length < 2) {
      setError('Select at least 2 assets');
      return;
    }
    if (!startDate || !endDate) {
      setError('Select start and end dates');
      return;
    }
    if (startDate >= endDate) {
      setError('Start date must be before end date');
      return;
    }

    setError('');
    setIsOptimizing(true);
    setResult(null);

    try {
      const response = await fetch('/api/optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetIds: selectedAssets,
          startDate,
          endDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Optimization failed');
      }

      const data = await response.json();
      setResult(data.optimization);
      toast('Optimization complete', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
      toast('Optimization failed', 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  const toggleAsset = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Portfolio Optimizer</h1>
        <p className="page-description">
          Find optimal asset allocations using Markowitz mean-variance optimization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Assets (select 2+)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => toggleAsset(asset.id)}
                    className={`px-3 py-2 text-[12px] font-mono rounded-lg border transition-all text-left ${
                      selectedAssets.includes(asset.id)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border/50 hover:border-border hover:bg-muted/20'
                    }`}
                  >
                    {asset.symbol}
                    {asset.displayName && (
                      <span className="text-muted-foreground ml-1 text-[10px]">{asset.displayName}</span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/60">{selectedAssets.length} selected</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-negative/5 border border-negative/15 px-3 py-2.5 text-[13px] text-negative">
                {error}
              </div>
            )}

            <Button onClick={handleOptimize} disabled={isOptimizing}>
              {isOptimizing ? 'Optimizing...' : 'Optimize'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioOptimizer data={result} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

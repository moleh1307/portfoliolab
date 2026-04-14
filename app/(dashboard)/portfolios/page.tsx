'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { validateWeights, parseWeightInput } from '@/lib/validators/portfolio';

interface Asset {
  id: string;
  symbol: string;
  displayName: string | null;
  datasetId: string;
  firstDate: string | null;
  lastDate: string | null;
  dataset: { id: string; name: string };
}

interface Holding {
  assetId: string;
  weight: number;
  asset?: Asset;
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  holdings: { assetId: string; weight: number; asset: Asset }[];
  createdAt: string;
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

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

  const fetchAssets = useCallback(async () => {
    try {
      const response = await fetch('/api/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPortfolios(), fetchAssets()]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchPortfolios, fetchAssets]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setHoldings([]);
    setFormError('');
    setFormSuccess('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddAsset = (assetId: string) => {
    if (holdings.some((h) => h.assetId === assetId)) return;
    setHoldings([...holdings, { assetId, weight: 0 }]);
  };

  const handleRemoveAsset = (assetId: string) => {
    setHoldings(holdings.filter((h) => h.assetId !== assetId));
  };

  const handleWeightChange = (assetId: string, value: string) => {
    const weight = parseWeightInput(value);
    if (weight === null) return;
    setHoldings(
      holdings.map((h) =>
        h.assetId === assetId ? { ...h, weight } : h
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const validation = validateWeights(holdings);
    if (!validation.valid) {
      setFormError(validation.errors[0]);
      return;
    }

    try {
      const url = editingId
        ? `/api/portfolios/${editingId}`
        : '/api/portfolios';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription || undefined,
          holdings,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save portfolio');
      }

      setFormSuccess(editingId ? 'Portfolio updated' : 'Portfolio created');
      fetchPortfolios();
      setTimeout(resetForm, 1200);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save portfolio');
    }
  };

  const handleEdit = (portfolio: Portfolio) => {
    setFormName(portfolio.name);
    setFormDescription(portfolio.description || '');
    setHoldings(
      portfolio.holdings.map((h) => ({
        assetId: h.assetId,
        weight: h.weight,
      }))
    );
    setEditingId(portfolio.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this portfolio?')) return;

    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchPortfolios();
      }
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
    }
  };

  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  const weightValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div>
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Portfolios</h1>
          <p className="page-description">
            Define portfolio allocations by selecting assets and assigning target weights.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Create Portfolio
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Portfolio' : 'New Portfolio'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Balanced Growth"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Optional description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Holdings</Label>
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5">
                    {holdings.map((holding) => {
                      const asset = assets.find((a) => a.id === holding.assetId);
                      return (
                        <div key={holding.assetId} className="flex items-center justify-between gap-3">
                          <span className="text-[13px] font-mono font-medium">{asset?.symbol}</span>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="0"
                                className="w-[72px] text-right font-mono tabular-nums pr-7"
                                value={holding.weight || ''}
                                onChange={(e) =>
                                  handleWeightChange(holding.assetId, e.target.value)
                                }
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">%</span>
                            </div>
                            <button
                              type="button"
                              className="text-[11px] text-muted-foreground hover:text-negative transition-colors"
                              onClick={() => handleRemoveAsset(holding.assetId)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {holdings.length === 0 && (
                      <p className="text-[13px] text-muted-foreground text-center py-4">
                        Add assets from below to build your allocation.
                      </p>
                    )}

                    {holdings.length > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <span className="text-[13px] font-medium">Total</span>
                        <span className={`text-[13px] font-mono font-semibold tabular-nums ${
                          weightValid ? 'text-positive' : 'text-negative'
                        }`}>
                          {totalWeight.toFixed(2)}%
                        </span>
                      </div>
                    )}

                    {!weightValid && holdings.length > 0 && (
                      <p className="text-[11px] text-negative text-right">
                        Weights must sum to 100%
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Available Assets</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {assets
                      .filter((a) => !holdings.some((h) => h.assetId === a.id))
                      .map((asset) => (
                        <Button
                          key={asset.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="font-mono text-[11px]"
                          onClick={() => handleAddAsset(asset.id)}
                        >
                          + {asset.symbol}
                        </Button>
                      ))}
                    {assets.length === 0 && (
                      <p className="text-[13px] text-muted-foreground">
                        No assets available. Upload a dataset first.
                      </p>
                    )}
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
                  <Button type="submit" disabled={holdings.length === 0 || !weightValid}>
                    {editingId ? 'Update' : 'Create'}
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
          <h2 className="section-title mb-3">Your Portfolios</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-16 rounded-lg border border-border animate-pulse-subtle bg-muted/30" />
              ))}
            </div>
          ) : portfolios.length === 0 && !showForm ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 py-16 text-center">
              <p className="text-[13px] text-muted-foreground">No portfolios yet. Create your first portfolio above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="group flex items-start justify-between rounded-lg border border-border bg-card px-4 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-medium">{portfolio.name}</h3>
                    {portfolio.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 max-w-md truncate">
                        {portfolio.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {portfolio.holdings.map((h) => (
                        <span
                          key={h.assetId}
                          className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono"
                        >
                          <span className="font-medium">{h.asset?.symbol}</span>
                          <span className="text-muted-foreground">{h.weight}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(portfolio)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-negative"
                      onClick={() => handleDelete(portfolio.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
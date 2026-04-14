'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

      setFormSuccess(editingId ? 'Portfolio updated!' : 'Portfolio created!');
      fetchPortfolios();
      setTimeout(resetForm, 1000);
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
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
          <p className="text-muted-foreground">
            Create and manage your portfolio configurations
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Create Portfolio
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Portfolio' : 'Create Portfolio'}</CardTitle>
            <CardDescription>
              Select assets and assign weights. Weights must sum to 100%.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Portfolio Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Balanced Growth"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of this portfolio strategy"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Holdings</Label>
                <div className="rounded-md border p-4 space-y-3">
                  {holdings.map((holding) => {
                    const asset = assets.find((a) => a.id === holding.assetId);
                    return (
                      <div key={holding.assetId} className="flex items-center gap-4">
                        <div className="flex-1">
                          <span className="font-medium">{asset?.symbol}</span>
                          {asset?.displayName && (
                            <span className="text-muted-foreground ml-2">
                              {asset.displayName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="0"
                            className="w-24 text-right"
                            value={holding.weight || ''}
                            onChange={(e) =>
                              handleWeightChange(holding.assetId, e.target.value)
                            }
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAsset(holding.assetId)}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}

                  {holdings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No holdings added yet. Select assets below.
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Total:</span>
                      <span
                        className={`text-sm font-bold ${
                          weightValid ? 'text-green-600' : 'text-destructive'
                        }`}
                      >
                        {totalWeight.toFixed(2)}%
                      </span>
                    </div>
                    {!weightValid && holdings.length > 0 && (
                      <span className="text-sm text-destructive">
                        Weights must sum to 100%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Available Assets</Label>
                <div className="flex flex-wrap gap-2">
                  {assets
                    .filter((a) => !holdings.some((h) => h.assetId === a.id))
                    .map((asset) => (
                      <Button
                        key={asset.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddAsset(asset.id)}
                      >
                        + {asset.symbol}
                      </Button>
                    ))}
                  {assets.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No assets available. Upload a dataset first.
                    </p>
                  )}
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
                <Button type="submit" disabled={holdings.length === 0 || !weightValid}>
                  {editingId ? 'Update Portfolio' : 'Create Portfolio'}
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
          <CardTitle>Your Portfolios</CardTitle>
          <CardDescription>Previously created portfolios</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : portfolios.length === 0 && !showForm ? (
            <p className="text-muted-foreground">
              No portfolios yet. Create your first portfolio above.
            </p>
          ) : (
            <div className="space-y-4">
              {portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <h4 className="font-medium">{portfolio.name}</h4>
                    {portfolio.description && (
                      <p className="text-sm text-muted-foreground">
                        {portfolio.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {portfolio.holdings.map((h) => (
                        <span
                          key={h.assetId}
                          className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                        >
                          {h.asset?.symbol}: {h.weight}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(portfolio)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(portfolio.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

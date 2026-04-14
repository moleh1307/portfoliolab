'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseCSV, type PriceRow } from '@/lib/csv/parser';

interface Dataset {
  id: string;
  name: string;
  fileName: string;
  status: string;
  importSummary: string | null;
  createdAt: string;
  assets: {
    id: string;
    symbol: string;
    displayName: string | null;
    firstDate: string | null;
    lastDate: string | null;
  }[];
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [datasetName, setDatasetName] = useState('');
  const [fileName, setFileName] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    rows: PriceRow[];
    errors: { row: number; column?: string; message: string }[];
    stats: { totalRows: number; validRows: number; invalidRows: number };
  } | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDatasets = useCallback(async () => {
    try {
      const response = await fetch('/api/datasets');
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets);
      }
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportError('');
    setImportSuccess('');
    setParseResult(null);

    const text = await file.text();
    setCsvContent(text);

    const result = parseCSV(text);
    setParseResult(result);
  };

  const handleUpload = async () => {
    if (!datasetName || !csvContent || !parseResult) {
      setImportError('Enter a dataset name and select a valid CSV file');
      return;
    }

    if (parseResult.rows.length === 0) {
      setImportError('CSV file contains no valid rows');
      return;
    }

    setIsUploading(true);
    setImportError('');
    setImportSuccess('');

    try {
      const createResponse = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: datasetName, fileName }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create dataset');
      }

      const { dataset } = await createResponse.json();

      const importResponse = await fetch('/api/datasets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: dataset.id, csvContent }),
      });

      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        throw new Error(errorData.error || 'Failed to import data');
      }

      const importResult = await importResponse.json();
      setImportSuccess(
        `${importResult.importResult.symbolsImported} symbols, ${importResult.importResult.priceRecordsCreated} records imported`
      );
      setDatasetName('');
      setFileName('');
      setCsvContent('');
      setParseResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchDatasets();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this dataset and all its data?')) return;

    try {
      const response = await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchDatasets();
      }
    } catch (error) {
      console.error('Failed to delete dataset:', error);
    }
  };

  return (
    <div>
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title">Datasets</h1>
          <p className="page-description">
            Upload historical price data to use for portfolio construction and backtesting.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Dataset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="datasetName">Name</Label>
                <Input
                  id="datasetName"
                  placeholder="e.g. US Equities 2018-2024"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="csvFile">CSV File</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {parseResult && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-foreground">File Preview</span>
                  <span className={`text-xs font-mono tabular-nums ${parseResult.success ? 'text-positive' : 'text-negative'}`}>
                    {parseResult.stats.validRows} of {parseResult.stats.totalRows} rows valid
                  </span>
                </div>

                {parseResult.errors.length > 0 && (
                  <div className="rounded-md bg-negative/5 border border-negative/15 px-3 py-2.5">
                    <p className="text-[11px] font-medium text-negative mb-1 uppercase tracking-wider">Errors</p>
                    <ul className="text-xs text-negative/80 space-y-0.5">
                      {parseResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="font-mono">
                          Row {error.row}{error.column && ` (${error.column})`}: {error.message}
                        </li>
                      ))}
                      {parseResult.errors.length > 5 && (
                        <li className="text-negative/60">+ {parseResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {parseResult.rows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="table-header text-left py-2 pr-4">Date</th>
                          <th className="table-header text-left py-2 pr-4">Symbol</th>
                          <th className="table-header text-right py-2 pl-4">Close</th>
                          {parseResult.rows[0].open !== undefined && (
                            <th className="table-header text-right py-2 pl-4">Open</th>
                          )}
                          {parseResult.rows[0].high !== undefined && (
                            <th className="table-header text-right py-2 pl-4">High</th>
                          )}
                          {parseResult.rows[0].low !== undefined && (
                            <th className="table-header text-right py-2 pl-4">Low</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-border/40 last:border-0">
                            <td className="py-1.5 pr-4 font-mono text-xs tabular-nums">{row.date}</td>
                            <td className="py-1.5 pr-4 text-[13px] font-medium">{row.symbol}</td>
                            <td className="py-1.5 pl-4 text-right font-mono text-xs tabular-nums">${row.close.toFixed(2)}</td>
                            {row.open !== undefined && (
                              <td className="py-1.5 pl-4 text-right font-mono text-xs tabular-nums">${row.open.toFixed(2)}</td>
                            )}
                            {row.high !== undefined && (
                              <td className="py-1.5 pl-4 text-right font-mono text-xs tabular-nums">${row.high.toFixed(2)}</td>
                            )}
                            {row.low !== undefined && (
                              <td className="py-1.5 pl-4 text-right font-mono text-xs tabular-nums">${row.low.toFixed(2)}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parseResult.rows.length > 5 && (
                      <p className="text-[11px] text-muted-foreground mt-2 tabular-nums">
                        Showing 5 of {parseResult.rows.length} rows
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {importError && (
              <div className="rounded-md bg-negative/5 border border-negative/15 px-3 py-2.5 text-[13px] text-negative">
                {importError}
              </div>
            )}

            {importSuccess && (
              <div className="rounded-md bg-positive/5 border border-positive/15 px-3 py-2.5 text-[13px] text-positive">
                {importSuccess}
              </div>
            )}

            <div className="flex pt-1">
              <Button
                onClick={handleUpload}
                disabled={!datasetName || !parseResult || parseResult.rows.length === 0 || isUploading}
              >
                {isUploading ? 'Importing...' : 'Import Dataset'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="section-title mb-3">Your Datasets</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-16 rounded-lg border border-border animate-pulse-subtle bg-muted/30" />
              ))}
            </div>
          ) : datasets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 py-16 text-center">
              <p className="text-[13px] text-muted-foreground">No datasets yet. Upload a CSV file to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-medium text-foreground">{dataset.name}</h3>
                      <span className={`status-dot ${dataset.status === 'completed' ? 'status-dot-completed' : dataset.status === 'partial' ? 'status-dot-partial' : 'status-dot-pending'}`} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      <span className="font-mono">{dataset.fileName}</span>
                      <span className="text-border/60">&middot;</span>
                      <span>{dataset.assets.length} symbols</span>
                    </div>
                    {dataset.assets.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dataset.assets.slice(0, 6).map(a => (
                          <span key={a.id} className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-foreground/80">
                            {a.symbol}
                          </span>
                        ))}
                        {dataset.assets.length > 6 && (
                          <span className="text-[10px] text-muted-foreground self-center">+{dataset.assets.length - 6}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-negative"
                    onClick={() => handleDelete(dataset.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
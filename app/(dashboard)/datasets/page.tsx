'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const router = useRouter();
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

  useState(() => {
    fetchDatasets();
  });

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
      setImportError('Please enter a dataset name and select a valid CSV file');
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
        `Successfully imported ${importResult.importResult.symbolsImported} symbols with ${importResult.importResult.priceRecordsCreated} price records`
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
    if (!confirm('Are you sure you want to delete this dataset?')) return;

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Datasets</h1>
        <p className="text-muted-foreground">
          Upload and manage your historical price data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Dataset</CardTitle>
          <CardDescription>
            Upload a CSV file with historical price data. Required columns: date, symbol, close.
            Optional columns: open, high, low, volume.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="datasetName">Dataset Name</Label>
            <Input
              id="datasetName"
              placeholder="e.g., US Stocks 2018-2024"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvFile">CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {parseResult && (
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Preview</h4>
                <span className={`text-sm ${parseResult.success ? 'text-green-600' : 'text-yellow-600'}`}>
                  {parseResult.stats.validRows} valid / {parseResult.stats.totalRows} total rows
                </span>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="mb-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium mb-1">Errors found:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {parseResult.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>
                        Row {error.row}
                        {error.column && ` (${error.column})`}: {error.message}
                      </li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>...and {parseResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}

              {parseResult.rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-1">Date</th>
                        <th className="text-left py-2 px-1">Symbol</th>
                        <th className="text-right py-2 px-1">Close</th>
                        {parseResult.rows[0].open !== undefined && (
                          <th className="text-right py-2 px-1">Open</th>
                        )}
                        {parseResult.rows[0].high !== undefined && (
                          <th className="text-right py-2 px-1">High</th>
                        )}
                        {parseResult.rows[0].low !== undefined && (
                          <th className="text-right py-2 px-1">Low</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-1">{row.date}</td>
                          <td className="py-2 px-1 font-medium">{row.symbol}</td>
                          <td className="py-2 px-1 text-right">${row.close.toFixed(2)}</td>
                          {row.open !== undefined && (
                            <td className="py-2 px-1 text-right">${row.open.toFixed(2)}</td>
                          )}
                          {row.high !== undefined && (
                            <td className="py-2 px-1 text-right">${row.high.toFixed(2)}</td>
                          )}
                          {row.low !== undefined && (
                            <td className="py-2 px-1 text-right">${row.low.toFixed(2)}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parseResult.rows.length > 5 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing first 5 of {parseResult.rows.length} rows...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {importError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="rounded-md bg-green-600/10 p-3 text-sm text-green-600">
              {importSuccess}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!datasetName || !parseResult || parseResult.rows.length === 0 || isUploading}
          >
            {isUploading ? 'Importing...' : 'Import Dataset'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Datasets</CardTitle>
          <CardDescription>
            Previously uploaded datasets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : datasets.length === 0 ? (
            <p className="text-muted-foreground">No datasets yet. Upload your first CSV file above.</p>
          ) : (
            <div className="space-y-4">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <h4 className="font-medium">{dataset.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {dataset.fileName} • {dataset.assets.length} symbols
                      {dataset.status === 'completed' && ' • Completed'}
                      {dataset.status === 'partial' && ' • Partial (some errors)'}
                      {dataset.status === 'pending' && ' • Pending'}
                    </p>
                    {dataset.assets.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {dataset.assets.map(a => a.symbol).join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(dataset.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

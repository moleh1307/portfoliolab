import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DatasetsPage() {
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
          <CardTitle>No datasets yet</CardTitle>
          <CardDescription>
            Upload a CSV file with historical price data to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Expected CSV format: date, symbol, close (plus optional open, high, low, volume)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

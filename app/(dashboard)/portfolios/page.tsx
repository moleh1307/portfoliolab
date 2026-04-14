import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PortfoliosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
        <p className="text-muted-foreground">
          Create and manage your portfolio configurations
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>No portfolios yet</CardTitle>
          <CardDescription>
            Create a portfolio by selecting assets and assigning weights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            First, upload a dataset in the Datasets section to see available assets
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

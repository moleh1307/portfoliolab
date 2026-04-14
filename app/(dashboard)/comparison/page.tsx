import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ComparisonPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare</h1>
        <p className="text-muted-foreground">
          Compare multiple backtest results side by side
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>No comparisons yet</CardTitle>
          <CardDescription>
            Run multiple backtests to compare their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select two or more saved backtests to see a side-by-side comparison
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

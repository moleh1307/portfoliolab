import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BacktestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Backtests</h1>
        <p className="text-muted-foreground">
          Run and view portfolio backtests
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>No backtests yet</CardTitle>
          <CardDescription>
            Create a portfolio and run a backtest to see historical performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Backtests require at least one portfolio with assigned weights
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

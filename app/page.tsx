import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="text-xl font-bold">PortfolioLab</div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium hover:underline"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            Portfolio Analytics Made Simple
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
            Upload your historical price data, build portfolios, run backtests,
            and analyze performance — all in one clean workspace.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-lg font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Log in
            </Link>
          </div>
        </section>
        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6">
              <h3 className="mb-3 text-lg font-semibold">Upload Price Data</h3>
              <p className="text-muted-foreground">
                Import your CSV files with historical asset prices. Preview and
                validate before importing.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-3 text-lg font-semibold">
                Build Portfolios
              </h3>
              <p className="text-muted-foreground">
                Create custom portfolios with weighted asset allocations.
                Validate that weights sum to 100%.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-3 text-lg font-semibold">
                Backtest & Analyze
              </h3>
              <p className="text-muted-foreground">
                Run backtests with configurable date ranges and rebalance
                frequencies. View detailed performance metrics.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container mx-auto h-16 px-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            PortfolioLab — Analytics and simulation tool
          </p>
        </div>
      </footer>
    </div>
  );
}

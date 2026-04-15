'use client';

interface RiskDecompositionData {
  symbols: string[];
  weights: number[];
  marginalRisk: number[];
  componentRisk: number[];
  pctContribution: number[];
  portfolioVolatility: number;
}

interface RiskDecompositionChartProps {
  data: RiskDecompositionData;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(280 50% 55%)',
  'hsl(30 80% 55%)',
  'hsl(180 50% 50%)',
];

export function RiskDecompositionChart({ data }: RiskDecompositionChartProps) {
  const { symbols, weights, marginalRisk, componentRisk, pctContribution, portfolioVolatility } = data;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Portfolio Vol:</span>
          <span className="font-mono font-semibold tabular-nums">{(portfolioVolatility * 100).toFixed(2)}%</span>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contribution to Risk</p>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/30">
          {symbols.map((symbol, i) => (
            <div
              key={symbol}
              className="h-full transition-all"
              style={{
                width: `${Math.max(0, pctContribution[i] * 100)}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
              title={`${symbol}: ${(pctContribution[i] * 100).toFixed(1)}%`}
            />
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="table-header text-left py-2 text-[11px]">Asset</th>
              <th className="table-header text-right py-2 text-[11px]">Weight</th>
              <th className="table-header text-right py-2 text-[11px]">Marginal Risk</th>
              <th className="table-header text-right py-2 text-[11px]">Component Risk</th>
              <th className="table-header text-right py-2 text-[11px]">% Contribution</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((symbol, i) => (
              <tr key={symbol} className="border-b border-border/20 last:border-0 transition-colors hover:bg-muted/20">
                <td className="py-2.5 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="font-mono font-medium text-[13px]">{symbol}</span>
                </td>
                <td className="py-2.5 text-right font-mono text-[13px] tabular-nums">{weights[i].toFixed(1)}%</td>
                <td className="py-2.5 text-right font-mono text-[13px] tabular-nums">{(marginalRisk[i] * 100).toFixed(2)}%</td>
                <td className="py-2.5 text-right font-mono text-[13px] tabular-nums">{(componentRisk[i] * 100).toFixed(2)}%</td>
                <td className="py-2.5 text-right font-mono text-[13px] tabular-nums">{(pctContribution[i] * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

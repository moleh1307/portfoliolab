'use client';

interface CorrelationMatrixData {
  symbols: string[];
  matrix: number[][];
}

interface CorrelationMatrixHeatmapProps {
  data: CorrelationMatrixData;
}

function getCorrelationColor(value: number): string {
  if (value >= 0.9) return 'hsl(220 80% 55% / 0.85)';
  if (value >= 0.7) return 'hsl(220 70% 55% / 0.65)';
  if (value >= 0.5) return 'hsl(220 60% 55% / 0.45)';
  if (value >= 0.3) return 'hsl(220 50% 55% / 0.3)';
  if (value >= 0.1) return 'hsl(220 40% 55% / 0.15)';
  if (value >= -0.1) return 'hsl(var(--muted) / 0.3)';
  if (value >= -0.3) return 'hsl(0 40% 55% / 0.15)';
  if (value >= -0.5) return 'hsl(0 50% 55% / 0.3)';
  if (value >= -0.7) return 'hsl(0 60% 55% / 0.45)';
  if (value >= -0.9) return 'hsl(0 70% 55% / 0.65)';
  return 'hsl(0 80% 55% / 0.85)';
}

export function CorrelationMatrixHeatmap({ data }: CorrelationMatrixHeatmapProps) {
  if (data.symbols.length === 0) {
    return (
      <div className="rounded-xl border border-border/30 bg-muted/20 px-6 py-8 text-center">
        <p className="text-[12px] text-muted-foreground">No correlation data available</p>
      </div>
    );
  }

  const { symbols, matrix } = data;
  const size = symbols.length;

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse w-auto">
        <thead>
          <tr>
            <th className="w-16"></th>
            {symbols.map((s) => (
              <th key={s} className="text-[10px] font-medium text-muted-foreground/60 font-mono text-center py-1 px-2 min-w-[48px]">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {symbols.map((symbol, i) => (
            <tr key={symbol}>
              <td className="text-[10px] font-mono text-muted-foreground pr-2 py-0.5">{symbol}</td>
              {matrix[i].map((value, j) => (
                <td
                  key={j}
                  className="text-center py-0.5 px-0.5"
                >
                  <div
                    className="rounded-sm px-2 py-1.5 text-[10px] font-mono tabular-nums transition-colors"
                    style={{ backgroundColor: getCorrelationColor(value) }}
                  >
                    <span className={i === j ? 'text-foreground/40' : 'text-foreground/80'}>
                      {value.toFixed(2)}
                    </span>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

interface MonthlyReturnData {
  year: number;
  month: number;
  return: number;
}

interface MonthlyReturnsHeatmapProps {
  data: MonthlyReturnData[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getReturnColor(value: number): string {
  const abs = Math.abs(value);
  if (abs < 0.005) return 'hsl(var(--muted))';
  if (value > 0) {
    if (abs < 0.02) return 'hsl(142 70% 45% / 0.15)';
    if (abs < 0.05) return 'hsl(142 70% 45% / 0.3)';
    if (abs < 0.1) return 'hsl(142 70% 45% / 0.5)';
    return 'hsl(142 70% 45% / 0.7)';
  }
  if (abs < 0.02) return 'hsl(0 70% 50% / 0.15)';
  if (abs < 0.05) return 'hsl(0 70% 50% / 0.3)';
  if (abs < 0.1) return 'hsl(0 70% 50% / 0.5)';
  return 'hsl(0 70% 50% / 0.7)';
}

export function MonthlyReturnsHeatmap({ data }: MonthlyReturnsHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border/30 bg-muted/20 px-6 py-8 text-center">
        <p className="text-[12px] text-muted-foreground">No monthly return data available</p>
      </div>
    );
  }

  const yearMap = new Map<number, Map<number, number>>();
  for (const item of data) {
    if (!yearMap.has(item.year)) {
      yearMap.set(item.year, new Map());
    }
    yearMap.get(item.year)!.set(item.month, item.return);
  }

  const years = Array.from(yearMap.keys()).sort();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-12 text-[10px] font-medium text-muted-foreground/60 font-mono"></th>
            {MONTH_LABELS.map((label) => (
              <th key={label} className="text-[10px] font-medium text-muted-foreground/60 font-mono text-center py-1">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year}>
              <td className="text-[11px] font-mono text-muted-foreground py-1 pr-2">{year}</td>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const value = yearMap.get(year)?.get(month);
                return (
                  <td
                    key={month}
                    className="text-center py-0.5"
                  >
                    <div
                      className="rounded-sm px-1.5 py-1 text-[10px] font-mono tabular-nums transition-colors"
                      style={{ backgroundColor: value != null ? getReturnColor(value) : 'transparent' }}
                    >
                      {value != null ? (
                        <span className={value >= 0 ? 'text-positive/80' : 'text-negative/80'}>
                          {(value * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground/20">&mdash;</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { TooltipProps } from 'recharts';

interface ChartTooltipProps extends TooltipProps<number, string> {
  label?: string;
  entries?: { name: string; value: number; color: string }[];
  valueFormatter?: (value: number, name: string) => string;
}

export function ChartTooltip({ active, payload, label, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const dateStr = label
    ? new Date(label as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm px-4 py-3 shadow-elevated min-w-[160px]">
      <p className="text-[11px] font-semibold text-foreground mb-2 tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
        {dateStr}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, i) => {
          const displayValue = valueFormatter
            ? valueFormatter(entry.value as number, entry.name || '')
            : String(entry.value);
          const color = (entry as any)?.color || 'hsl(var(--muted-foreground))';
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[12px] text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {entry.name}
                </span>
              </div>
              <span className="text-[12px] font-medium font-mono tabular-nums text-foreground">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';

interface MonteCarloData {
  percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number }[];
  finalValueStats: { mean: number; median: number; min: number; max: number; p5: number; p95: number };
  probabilityOfProfit: number;
  worstCase: number;
  bestCase: number;
  initialCapital: number;
}

interface MonteCarloChartProps {
  data: MonteCarloData;
}

export function MonteCarloChart({ data }: MonteCarloChartProps) {
  const chartData = data.percentiles.map((p, i) => ({
    day: i,
    p5: p.p5,
    p25: p.p25,
    p50: p.p50,
    p75: p.p75,
    p95: p.p95,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Median</p>
          <p className="text-[15px] font-semibold font-mono tabular-nums">${data.finalValueStats.median.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Mean</p>
          <p className="text-[15px] font-semibold font-mono tabular-nums">${data.finalValueStats.mean.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">P(Profit)</p>
          <p className="text-[15px] font-semibold font-mono tabular-nums">{(data.probabilityOfProfit * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">5th / 95th</p>
          <p className="text-[15px] font-semibold font-mono tabular-nums">${data.worstCase.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${data.bestCase.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="mcBand95" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.12} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="mcBand50" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: "'IBM Plex Mono', monospace" }}
            tickFormatter={(v) => `${v}d`}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: "'IBM Plex Mono', monospace" }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={56}
          />
          <Tooltip
            content={<ChartTooltip valueFormatter={(v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />}
            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <ReferenceLine y={data.initialCapital} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="p95"
            stackId="1"
            stroke="none"
            fill="url(#mcBand95)"
          />
          <Area
            type="monotone"
            dataKey="p75"
            stackId="2"
            stroke="none"
            fill="url(#mcBand50)"
          />
          <Line
            type="monotone"
            dataKey="p50"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: 'hsl(var(--chart-1))', strokeWidth: 3, stroke: 'hsl(var(--card))' }}
          />
          <Line
            type="monotone"
            dataKey="p5"
            stroke="hsl(var(--chart-3))"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="p95"
            stroke="hsl(var(--chart-3))"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[hsl(var(--chart-1))] rounded" />
          Median
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[hsl(var(--chart-3))] rounded" style={{ borderTop: '1px dashed' }} />
          5th / 95th
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded" style={{ backgroundColor: 'hsl(var(--chart-1) / 0.15)' }} />
          Confidence bands
        </span>
      </div>
    </div>
  );
}

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';

interface CumulativeReturnChartProps {
  data: { date: string; cumulativeReturn: number }[];
}

export function CumulativeReturnChart({ data }: CumulativeReturnChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: "'IBM Plex Mono', monospace" }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: "'IBM Plex Mono', monospace" }}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          width={52}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={(v) => `${(v * 100).toFixed(2)}%`} />}
          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="cumulativeReturn"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: 'hsl(var(--chart-2))', strokeWidth: 3, stroke: 'hsl(var(--card))' }}
          animationDuration={1200}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

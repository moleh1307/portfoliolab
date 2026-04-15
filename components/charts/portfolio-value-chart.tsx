'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
} from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';

interface PortfolioValueChartProps {
  data: { date: string; value: number }[];
}

export function PortfolioValueChart({ data }: PortfolioValueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="portfolioValueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.08} />
            <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          width={56}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={(v) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />}
          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="none"
          fill="url(#portfolioValueGradient)"
          animationDuration={1200}
          animationBegin={200}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: 'hsl(var(--chart-1))', strokeWidth: 3, stroke: 'hsl(var(--card))' }}
          animationDuration={1200}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

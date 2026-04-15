'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface CumulativeReturnChartProps {
  data: { date: string; cumulativeReturn: number }[];
}

export function CumulativeReturnChart({ data }: CumulativeReturnChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
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
          width={44}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
            fontSize: '12px',
            fontFamily: "'IBM Plex Mono', monospace",
            padding: '10px 12px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', marginBottom: '4px', fontWeight: 600, fontFamily: 'Inter, sans-serif', fontSize: '11px', letterSpacing: '0.02em' }}
          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Return']}
        />
        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
        <Line
          type="monotone"
          dataKey="cumulativeReturn"
          stroke="hsl(var(--chart-2))"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: 'hsl(var(--chart-2))', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
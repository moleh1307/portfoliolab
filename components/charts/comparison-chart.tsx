'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ComparisonDataPoint {
  date: string;
  [key: string]: number | string;
}

interface ComparisonChartProps {
  data: ComparisonDataPoint[];
  lines: { key: string; name: string; color: string }[];
}

export function ComparisonChart({ data, lines }: ComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
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
          width={48}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgb(0 0 0 / 0.08)',
            fontSize: '12px',
            fontFamily: "'IBM Plex Mono', monospace",
            padding: '10px 14px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', marginBottom: '4px', fontWeight: 600, fontFamily: 'Inter, sans-serif', fontSize: '11px', letterSpacing: '0.02em' }}
          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }}
          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          formatter={(value: number, name: string) => [`${(value * 100).toFixed(2)}%`, name]}
        />
        <Legend
          wrapperStyle={{
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            paddingTop: '16px',
          }}
          formatter={(value, entry) => {
            const color = (entry as any)?.color || 'currentColor';
            return (
              <span style={{ color: 'hsl(var(--foreground))', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
                {value}
              </span>
            );
          }}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

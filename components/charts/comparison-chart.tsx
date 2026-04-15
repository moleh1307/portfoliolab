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
import { ChartTooltip } from '@/components/ui/chart-tooltip';

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
    <ResponsiveContainer width="100%" height={340}>
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
          content={<ChartTooltip />}
          cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }}
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
        {lines.map((line, i) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 3, stroke: 'hsl(var(--card))' }}
            animationDuration={1200}
            animationBegin={i * 150}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

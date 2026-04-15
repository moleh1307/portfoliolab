'use client';

import { useState } from 'react';
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

interface RollingDataPoint {
  date: string;
  rollingReturn: number;
  rollingVolatility: number;
  rollingSharpe: number;
  rollingBeta: number | null;
}

interface RollingAnalysisChartProps {
  data: RollingDataPoint[];
}

type MetricKey = 'rollingReturn' | 'rollingVolatility' | 'rollingSharpe' | 'rollingBeta';

const METRICS: { key: MetricKey; label: string; color: string; format: (v: number) => string }[] = [
  { key: 'rollingReturn', label: 'Ann. Return', color: 'hsl(var(--chart-1))', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'rollingVolatility', label: 'Volatility', color: 'hsl(var(--chart-3))', format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: 'rollingSharpe', label: 'Sharpe', color: 'hsl(var(--chart-2))', format: (v) => v.toFixed(2) },
  { key: 'rollingBeta', label: 'Beta', color: 'hsl(var(--chart-4))', format: (v) => v.toFixed(2) },
];

export function RollingAnalysisChart({ data }: RollingAnalysisChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('rollingReturn');
  const metric = METRICS.find(m => m.key === activeMetric)!;

  const hasBeta = data.some(d => d.rollingBeta != null);
  const availableMetrics = hasBeta ? METRICS : METRICS.filter(m => m.key !== 'rollingBeta');

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        {availableMetrics.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
              activeMetric === m.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
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
            tickFormatter={(value) => metric.format(value)}
            width={60}
          />
          <Tooltip
            content={<ChartTooltip valueFormatter={(v: number) => metric.format(v)} />}
            cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          {activeMetric === 'rollingReturn' && (
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4" />
          )}
          {activeMetric === 'rollingBeta' && (
            <ReferenceLine y={1} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4" />
          )}
          <Line
            type="monotone"
            dataKey={activeMetric}
            stroke={metric.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: metric.color, strokeWidth: 3, stroke: 'hsl(var(--card))' }}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

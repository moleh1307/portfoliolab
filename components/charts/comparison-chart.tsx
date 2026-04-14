'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
        />
        <Tooltip
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          formatter={(value: number, name: string) => [`${(value * 100).toFixed(2)}%`, name]}
        />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

'use client';

import { useState } from 'react';

interface PortfolioAllocation {
  weights: number[];
  symbols: string[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
}

interface EfficientFrontierPoint {
  volatility: number;
  expectedReturn: number;
  sharpeRatio: number;
  weights: number[];
}

interface OptimizationData {
  minimumVariance: PortfolioAllocation;
  maximumSharpe: PortfolioAllocation;
  efficientFrontier: EfficientFrontierPoint[];
  symbols: string[];
}

interface PortfolioOptimizerProps {
  data: OptimizationData;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(280 50% 55%)',
  'hsl(30 80% 55%)',
  'hsl(180 50% 50%)',
];

function AllocationBar({ allocation, symbols }: { allocation: PortfolioAllocation; symbols: string[] }) {
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/30 mb-3">
        {allocation.weights.map((w, i) => (
          <div
            key={allocation.symbols[i]}
            className="h-full transition-all"
            style={{
              width: `${w}%`,
              backgroundColor: COLORS[i % COLORS.length],
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {allocation.symbols.map((symbol, i) => (
          <div key={symbol} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-[11px] font-mono text-muted-foreground">{symbol}</span>
            <span className="text-[11px] font-mono font-medium tabular-nums">{allocation.weights[i].toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PortfolioOptimizer({ data }: PortfolioOptimizerProps) {
  const [activeTab, setActiveTab] = useState<'minVar' | 'maxSharpe'>('maxSharpe');
  const active = activeTab === 'minVar' ? data.minimumVariance : data.maximumSharpe;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('maxSharpe')}
          className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
            activeTab === 'maxSharpe'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          Max Sharpe
        </button>
        <button
          onClick={() => setActiveTab('minVar')}
          className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
            activeTab === 'minVar'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          Min Variance
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Ann. Return</p>
          <p className="text-[18px] font-semibold font-mono tabular-nums">{(active.expectedReturn * 100).toFixed(2)}%</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Volatility</p>
          <p className="text-[18px] font-semibold font-mono tabular-nums">{(active.volatility * 100).toFixed(2)}%</p>
        </div>
        <div className="rounded-xl bg-muted/30 px-4 py-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sharpe</p>
          <p className="text-[18px] font-semibold font-mono tabular-nums">{active.sharpeRatio.toFixed(2)}</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Optimal Weights</p>
        <AllocationBar allocation={active} symbols={data.symbols} />
      </div>

      <div className="rounded-xl border border-border/40 bg-muted/10 p-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Comparison</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Max Sharpe</p>
            <p className="text-[13px] font-mono tabular-nums">Return: {(data.maximumSharpe.expectedReturn * 100).toFixed(2)}%</p>
            <p className="text-[13px] font-mono tabular-nums">Vol: {(data.maximumSharpe.volatility * 100).toFixed(2)}%</p>
            <p className="text-[13px] font-mono tabular-nums">Sharpe: {data.maximumSharpe.sharpeRatio.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Min Variance</p>
            <p className="text-[13px] font-mono tabular-nums">Return: {(data.minimumVariance.expectedReturn * 100).toFixed(2)}%</p>
            <p className="text-[13px] font-mono tabular-nums">Vol: {(data.minimumVariance.volatility * 100).toFixed(2)}%</p>
            <p className="text-[13px] font-mono tabular-nums">Sharpe: {data.minimumVariance.sharpeRatio.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

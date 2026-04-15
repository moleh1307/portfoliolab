import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl bg-muted/60 animate-pulse', className)} />
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-3.5 rounded-lg bg-muted/60 animate-pulse',
            i === 0 ? 'w-24' : i === cols - 1 ? 'w-16' : 'w-20'
          )}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-3">
      <div className="h-4 w-32 rounded-lg bg-muted/60 animate-pulse" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-3 rounded-lg bg-muted/60 animate-pulse',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function MetricGridSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 divide-x divide-border/40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 py-4 space-y-2">
            <div className="h-2.5 w-14 rounded-lg bg-muted/60 animate-pulse" />
            <div className="h-5 w-20 rounded-lg bg-muted/60 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="border-t border-border/40" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 divide-x divide-border/40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 py-4 space-y-2">
            <div className="h-2.5 w-14 rounded-lg bg-muted/60 animate-pulse" />
            <div className="h-5 w-20 rounded-lg bg-muted/60 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

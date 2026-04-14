'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Datasets', href: '/datasets' },
  { name: 'Portfolios', href: '/portfolios' },
  { name: 'Backtests', href: '/backtests' },
  { name: 'Compare', href: '/comparison' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/datasets" className="text-xl font-bold">
              PortfolioLab
            </Link>
            <nav className="flex gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}

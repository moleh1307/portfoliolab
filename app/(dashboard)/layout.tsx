'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/toast';
import { AlertDialog } from '@/components/ui/alert-dialog';

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
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="mx-auto max-w-6xl px-5">
            <div className="flex h-[52px] items-center justify-between">
              <div className="flex items-center gap-8">
                <Link
                  href="/datasets"
                  className="flex items-center gap-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-[3px] bg-foreground">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 9L4 3L7 7L10 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-[13px] font-semibold tracking-tight text-foreground">
                    PortfolioLab
                  </span>
                </Link>
                <nav className="hidden sm:flex items-center">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'relative px-3 py-[14px] text-[13px] font-medium transition-colors duration-150',
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {item.name}
                        {isActive && (
                          <span className="absolute bottom-0 inset-x-3 h-[1.5px] bg-foreground rounded-full" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
                <div className="flex sm:hidden">
                  <select
                    className="h-8 rounded-md border border-border bg-background px-2 text-[13px] text-foreground"
                    value={navigation.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.href || ''}
                    onChange={(e) => { if (e.target.value) window.location.href = e.target.value; }}
                  >
                    {navigation.map((item) => (
                      <option key={item.href} value={item.href}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main id="main-content" className="flex-1">
          <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
        </main>
        <AlertDialog />
      </div>
    </ToastProvider>
  );
}
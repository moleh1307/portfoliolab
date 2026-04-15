'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/toast';
import { AlertDialog } from '@/components/ui/alert-dialog';

const navigation = [
  { name: 'Datasets', href: '/datasets' },
  { name: 'Portfolios', href: '/portfolios' },
  { name: 'Backtests', href: '/backtests' },
  { name: 'Compare', href: '/comparison' },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  if (!mounted) return <div className="h-8 w-8" />;

  return (
    <button
      onClick={toggle}
      className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
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
                    className="h-8 rounded-md border border-border bg-background px-2 pr-7 text-[13px] text-foreground appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                    }}
                    value={navigation.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.href || ''}
                    onChange={(e) => { if (e.target.value) window.location.href = e.target.value; }}
                    aria-label="Navigate to"
                  >
                    {navigation.map((item) => (
                      <option key={item.href} value={item.href}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main id="main-content" className="flex-1">
          <div key={pathname} className="mx-auto max-w-6xl px-5 py-8 animate-page-in">{children}</div>
        </main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-4">
            <p className="text-[11px] text-muted-foreground/60 text-center">
              PortfolioLab &mdash; Portfolio backtesting and analytics
            </p>
          </div>
        </footer>
        <AlertDialog />
      </div>
    </ToastProvider>
  );
}
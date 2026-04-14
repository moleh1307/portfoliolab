import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PortfolioLab',
  description: 'Build, test, and analyze investment portfolios using historical market data',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}

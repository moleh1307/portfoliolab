export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="text-xl font-bold">PortfolioLab</div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

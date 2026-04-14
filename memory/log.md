# PortfolioLab - Shared Memory Log

## Project Overview
- **Project**: PortfolioLab - Full-stack portfolio analytics application
- **Stack**: Next.js 13.5 (App Router), NextAuth.js, Prisma (SQLite), Tailwind CSS, TypeScript
- **Phase**: Phase 1 - Repository and Foundation ✅ COMPLETE

## Current State
- [x] Repository structure created
- [x] Next.js project initialized with TypeScript and Tailwind
- [x] Core dependencies installed (Prisma, NextAuth, Zod, Recharts)
- [x] Database schema created (User, Dataset, Asset, PriceRecord, Portfolio, PortfolioHolding, BacktestRun, BacktestPoint)
- [x] Authentication configured (NextAuth.js with credentials provider)
- [x] Login and Register pages created
- [x] Dashboard layout with protected routes
- [x] Placeholder pages for Datasets, Portfolios, Backtests, Comparison
- [x] Build passes (`npm run build`)
- [x] Typecheck passes (`npm run typecheck`)

## Tech Stack Notes
- Next.js 13.5.7 (downgraded from 15 due to Node.js 18.16.0 compatibility)
- Node.js 18.16.0 is the environment version

## Next Steps
- Phase 2: Dataset import (CSV upload flow, validation, preview)
- Phase 3: Portfolio builder (create/edit/delete portfolios, weight assignment)
- Phase 4: Backtest engine (core analytics logic, computation path)
- Phase 5: Results dashboard (charts, metrics)
- Phase 6: Comparison and polish

## Key Files
- `prisma/schema.prisma` - Database schema
- `lib/auth.ts` - NextAuth configuration options
- `app/api/auth/[...nextauth]/route.ts` - NextAuth route handlers
- `app/api/auth/register/route.ts` - User registration endpoint
- `app/(dashboard)/layout.tsx` - Protected dashboard layout with session check
- `lib/db/index.ts` - Prisma client singleton

## Architecture Notes
- Feature-based folder structure under `features/`
- Analytics engine must be independent and testable (see `lib/analytics/`)
- UI components isolated in `components/ui/`
- Shared utilities in `lib/utils.ts`

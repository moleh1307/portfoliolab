# PortfolioLab

A portfolio backtesting and analysis application for constructing portfolios from historical market data, running historical simulations, and evaluating performance metrics.

## Overview

PortfolioLab enables historical portfolio simulation using uploaded price data. Users define portfolios with asset allocations, configure backtest parameters, and analyze performance over specified date ranges.

## Core Functionality

- **Dataset Import**: Upload CSV files containing historical price data with validation
- **Portfolio Construction**: Define portfolios by selecting assets and assigning weights
- **Backtesting**: Run historical simulations with configurable date ranges, rebalance frequencies, and initial capital
- **Performance Analysis**: View cumulative returns, drawdown series, volatility, Sharpe ratio, and summary statistics
- **Portfolio Comparison**: Compare multiple backtest runs on shared charts

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 13.5 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS |
| Database | SQLite via Prisma ORM |
| Validation | Zod |
| Charts | Recharts |
| Testing | Vitest |

## Installation

```bash
git clone git@github.com:moleh1307/portfoliolab.git
cd portfoliolab
npm install
```

## Environment Setup

Initialize the SQLite database:

```bash
npm run db:push
```

The database is stored locally as `prisma/dev.db`.

## Running Locally

```bash
npm run dev
```

Open http://localhost:3000.

## Input Data Format

PortfolioLab accepts CSV files with the following columns:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `date` | string | Yes | ISO date format (YYYY-MM-DD) |
| `symbol` | string | Yes | Asset ticker (e.g., AAPL, SPY) |
| `close` | number | Yes | Closing price |
| `open` | number | No | Opening price |
| `high` | number | No | Daily high |
| `low` | number | No | Daily low |
| `volume` | number | No | Trading volume |

Example:

```csv
date,symbol,close
2024-01-02,AAPL,185.50
2024-01-02,MSFT,375.20
2024-01-03,AAPL,186.75
2024-01-03,MSFT,377.10
```

The CSV parser validates all rows and reports specific errors for invalid entries.

## Project Structure

```
portfoliolab/
├── app/
│   ├── (dashboard)/        # Main application pages
│   │   ├── datasets/
│   │   ├── portfolios/
│   │   ├── backtests/
│   │   └── comparison/
│   └── api/               # REST API routes
├── components/
│   ├── charts/            # Recharts-based chart components
│   └── ui/                # Base UI components
├── lib/
│   ├── analytics/         # Backtest computation engine
│   ├── csv/               # CSV parsing and validation
│   ├── db/                # Prisma client singleton
│   └── validators/        # Portfolio validation logic
├── prisma/
│   └── schema.prisma      # Database schema (8 models)
└── tests/                 # Unit tests (35 tests)
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npx vitest run` | Execute unit tests |
| `npm run db:studio` | Open Prisma Studio |

## Testing

The project includes 35 unit tests covering core logic:

- CSV parser and validation (`tests/csv-parser.test.ts`)
- Portfolio weight validation (`tests/portfolio-validators.test.ts`)
- Backtest engine computation (`tests/analytics-engine.test.ts`)

## Current Status

All six phases are complete:

- Phase 1: Repository foundation and database schema
- Phase 2: Dataset import with CSV validation
- Phase 3: Portfolio builder with weight validation
- Phase 4: Backtest engine with analytics
- Phase 5: Results dashboard with charts
- Phase 6: Portfolio comparison

The application runs locally without authentication.

## License

MIT License

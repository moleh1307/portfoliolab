# PortfolioLab

A full-stack web application for building, testing, and analyzing investment portfolios using historical market data.

![Next.js](https://img.shields.io/badge/Next.js-13.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

PortfolioLab helps you answer the question: **"If I had invested in this portfolio under these assumptions, how would it have performed over time?"**

Upload your historical price data, define custom portfolios with asset weights, configure rebalance rules, run backtests, and inspect performance metrics — all in a clean, intuitive interface.

## Features

- **📊 Dataset Management** — Upload CSV files with historical price data, preview before importing, and validate automatically
- **💼 Portfolio Builder** — Create portfolios by selecting assets and assigning weights with 100% validation
- **📈 Backtesting Engine** — Run simulations with configurable date ranges, rebalance frequencies (none/monthly/quarterly), and initial capital
- **📉 Performance Analytics** — View cumulative returns, drawdowns, volatility, Sharpe ratio, and more
- **🔄 Strategy Comparison** — Compare multiple portfolios side-by-side to find the best approach

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 13, React 18, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, NextAuth.js |
| Database | SQLite (development), PostgreSQL (production) |
| ORM | Prisma |
| Validation | Zod |
| Charts | Recharts |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/moleh1307/portfoliolab.git
cd portfoliolab

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize the database
npm run db:push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### CSV Format

Your CSV files should include these columns:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `date` | string | ✅ | Format: YYYY-MM-DD |
| `symbol` | string | ✅ | Asset ticker (e.g., AAPL, SPY) |
| `close` | number | ✅ | Closing price |
| `open` | number | ❌ | Opening price |
| `high` | number | ❌ | Highest price |
| `low` | number | ❌ | Lowest price |
| `volume` | number | ❌ | Trading volume |

Example:
```csv
date,symbol,close
2024-01-01,AAPL,185.50
2024-01-02,AAPL,186.75
2024-01-03,SPY,475.20
```

## Project Structure

```
portfoliolab/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/        # Protected dashboard pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   └── ui/                # Base components (Button, Card, Input...)
├── features/              # Feature modules
│   ├── auth/
│   ├── datasets/
│   ├── portfolios/
│   └── backtests/
├── lib/                   # Core utilities
│   ├── analytics/         # Portfolio analytics engine
│   ├── csv/               # CSV parsing and validation
│   └── db/                # Database client
├── prisma/                # Database schema
└── tests/                 # Unit and integration tests
```

## Development

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm test

# Build for production
npm run build

# Open Prisma Studio
npm run db:studio
```

## Roadmap

- [x] Phase 1: Repository foundation with auth and UI shell
- [x] Phase 2: Dataset import with CSV validation
- [ ] Phase 3: Portfolio builder with weight validation
- [ ] Phase 4: Backtest engine with analytics
- [ ] Phase 5: Results dashboard with charts
- [ ] Phase 6: Comparison and polish

## Architecture Principles

- **Correctness over speed** — The analytics engine is isolated and fully testable
- **Fail clearly, not mysteriously** — Validation errors are specific and actionable
- **Clean separation** — Business logic never lives in UI components
- **Modular design** — Each feature has clear boundaries

## License

MIT License — see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

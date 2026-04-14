# Project: PortfolioLab

## 1. Project Summary

PortfolioLab is a full-stack web application for building, testing, and analyzing investment portfolios using historical market data uploaded by the user.

The product is meant to feel like a lightweight personal quant research workspace rather than a brokerage clone. A user should be able to upload price data, define one or more portfolios, configure rebalance rules, run a backtest, and inspect performance, drawdowns, allocation changes, and risk statistics in a clean interface.

The project should be substantial enough to require real architecture, data modeling, testing, and UI work, but still bounded enough to be completed by agents in phases without turning into an open-ended platform.

This is an analytics and simulation tool, not a live trading system.

---

## 2. Product Vision

The goal is to create a polished application that answers a simple question:

**“If I had invested in this portfolio under these assumptions, how would it have performed over time?”**

The application should help a user:

* upload or import historical asset prices
* define custom portfolios with asset weights
* choose a rebalance frequency
* run backtests over a chosen date range
* compare multiple portfolios
* inspect metrics and charts
* save and revisit prior analyses

The application should prioritize:

* correctness
* clarity
* usability
* reproducibility
* explainability of results

It should not prioritize:

* real-time trading
* broker integrations
* advanced derivatives pricing
* institutional-scale optimization
* social or collaborative features in the initial version

---

## 3. Product Type

This is a **medium-sized full-stack analytics product** with:

* a modern frontend
* an API/backend layer
* persistent storage
* data validation
* a small computational engine for portfolio analytics
* structured testing
* clear room for multi-agent collaboration

---

## 4. Target Users

### Primary User

A technically curious individual investor, student, or analyst who wants to test portfolio ideas using historical data without opening Jupyter notebooks every time.

### Secondary User

A beginner-to-intermediate quant learner who wants an opinionated but understandable portfolio research tool.

### User characteristics

The target user is comfortable with concepts like:

* asset weights
* return series
* cumulative return
* volatility
* Sharpe ratio
* drawdown
* rebalancing

The target user is not assumed to be a programmer.

---

## 5. Core User Stories

### Story 1: Upload data

As a user, I want to upload asset price history in CSV format so I can analyze my own data.

### Story 2: Create a portfolio

As a user, I want to define a portfolio by selecting assets and assigning weights so I can model an investment strategy.

### Story 3: Configure assumptions

As a user, I want to choose the backtest period and rebalance frequency so the simulation matches my intended strategy.

### Story 4: Run a backtest

As a user, I want to run a portfolio simulation and see results quickly.

### Story 5: Inspect performance

As a user, I want to see charts and summary metrics so I can understand the portfolio’s historical behavior.

### Story 6: Compare strategies

As a user, I want to compare two or more portfolios side by side.

### Story 7: Save my work

As a user, I want the portfolios and backtests to persist so I can return later.

---

## 6. Functional Scope

## 6.1 MVP Features

The MVP should include the following:

### A. Authentication

Basic authentication should exist, but keep it simple.

Requirements:

* email/password sign-up and login
* secure session handling
* only the owner can access their own data

This can be implemented with a standard auth library and should not become a major custom security project.

### B. Dataset management

Users must be able to upload historical price data as CSV.

Requirements:

* upload CSV files through the UI
* validate required columns
* parse rows into normalized records
* show a preview before final import
* reject malformed files with useful errors
* allow multiple uploaded datasets

Minimum CSV format:

* `date`
* `symbol`
* `close`

Optional additional columns:

* `open`
* `high`
* `low`
* `volume`

Assumptions:

* daily frequency only for MVP
* adjusted close can be ignored unless the dataset provides it explicitly
* the app does not need to fetch market data from third-party APIs in the MVP

### C. Asset registry

Once data is imported, the system should know which assets exist in the user’s available universe.

Requirements:

* list imported symbols
* show date range available for each symbol
* show source dataset name
* prevent duplicate broken imports

### D. Portfolio builder

Users must be able to create and edit portfolios.

Requirements:

* create a portfolio with a name and optional description
* add one or more assets
* assign weights
* validate weights sum to 100%
* allow cash weight as optional future extension, but not required in MVP
* allow editing and deleting portfolios

### E. Backtest configuration

Users must be able to configure a backtest run.

Fields:

* portfolio selection
* start date
* end date
* rebalance frequency: none / monthly / quarterly
* initial capital
* optional benchmark selection from imported assets
* optional transaction cost setting for MVP v2, not required in first iteration

### F. Backtest engine

The system must compute portfolio performance from uploaded historical prices.

The engine should:

* align dates across assets
* handle missing data conservatively
* compute daily returns
* compute portfolio returns based on weights
* apply rebalancing according to the chosen frequency
* produce a daily time series of portfolio value
* produce summary metrics

### G. Results dashboard

Users must be able to inspect the result of a backtest.

Display:

* cumulative portfolio value chart
* cumulative return chart
* drawdown chart
* summary metrics cards
* asset allocation table
* returns table

### H. Comparison view

Users must be able to compare multiple saved backtests.

Display:

* overlaid performance chart
* summary metrics comparison table
* benchmark comparison if available

### I. Persistence

The following should persist:

* users
* datasets
* assets
* portfolios
* backtest configurations
* backtest results metadata
* optionally cached result series

---

## 6.2 Post-MVP Features

These should be documented as future work, not built first:

* transaction costs
* slippage assumptions
* benchmark-relative metrics
* portfolio cloning
* strategy templates
* import from market APIs
* factor exposure analytics
* rolling volatility / rolling Sharpe charts
* export to PDF or CSV
* watchlist functionality
* scenario analysis
* Monte Carlo simulation
* dividend handling
* tax-aware performance
* optimization tools like minimum variance or max Sharpe

---

## 7. Non-Goals

To keep the project medium-sized and realistically completable, the following are explicitly out of scope for the initial version:

* live market data streaming
* paper trading
* broker connectivity
* real order execution
* options/futures pricing
* leverage and margin systems
* multi-user collaboration
* chat or social features
* mobile app
* enterprise permissions
* complex optimization solvers
* event-driven trading engine

---

## 8. Suggested Technical Direction

The project should be built as a clean modern monorepo or structured repository.

A recommended stack is:

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* charting library such as Recharts

### Backend

Option A:

* Next.js API routes / server actions for a simpler full-stack setup

Option B:

* FastAPI as separate backend if the team wants clearer separation and Python-based analytics

For this project, prefer the simpler architecture unless there is a compelling reason not to.

### Database

* PostgreSQL for realism, or SQLite for easier local development in early stages

### ORM

* Prisma or Drizzle if using TypeScript-first stack

### Validation

* Zod on the frontend and backend boundaries if using TypeScript

### Testing

* unit tests for analytics logic
* integration tests for API routes
* component tests for important UI elements
* end-to-end tests for critical user flows

### Deployment target

* local-first development
* optionally deployable to a common cloud platform later

---

## 9. Recommended Architecture

The codebase should be organized around clear feature boundaries.

A good high-level structure would be:

```text
app/
components/
features/
  auth/
  datasets/
  assets/
  portfolios/
  backtests/
  analytics/
lib/
db/
tests/
```

Or, if using a more explicit structure:

```text
src/
  app/
  components/
  modules/
    auth/
    datasets/
    portfolios/
    backtests/
    analytics/
  server/
  db/
  utils/
```

### Architectural goals

* avoid tangled business logic inside UI components
* keep analytics calculations isolated and testable
* keep parsing and validation separate from persistence
* keep API handlers thin
* keep domain logic reusable

### Important architectural rule

The portfolio analytics engine must be independent enough to test without rendering UI.

---

## 10. Domain Model

The project should roughly revolve around these entities:

### User

Represents an authenticated person using the application.

Fields:

* id
* email
* password hash or auth provider id
* created_at
* updated_at

### Dataset

Represents an uploaded CSV file and its import metadata.

Fields:

* id
* user_id
* name
* file_name
* status
* import_summary
* created_at

### Asset

Represents a symbol available to the user.

Fields:

* id
* user_id
* symbol
* display_name
* dataset_id or source reference
* first_date
* last_date

### PriceRecord

Represents daily price data for an asset.

Fields:

* id
* asset_id
* date
* close
* optional open/high/low/volume

### Portfolio

Represents a saved portfolio definition.

Fields:

* id
* user_id
* name
* description
* created_at
* updated_at

### PortfolioHolding

Represents target asset weights inside a portfolio.

Fields:

* id
* portfolio_id
* asset_id
* weight

### BacktestRun

Represents a single simulation run.

Fields:

* id
* user_id
* portfolio_id
* benchmark_asset_id optional
* start_date
* end_date
* rebalance_frequency
* initial_capital
* status
* summary_metrics
* created_at

### BacktestPoint

Represents daily time series data for a backtest run.

Fields:

* id
* backtest_run_id
* date
* portfolio_value
* portfolio_return
* drawdown
* benchmark_value optional

This can be stored persistently or computed and cached depending on the implementation strategy.

---

## 11. Analytics Requirements

The application does not need extremely advanced quant logic, but it does need a correct and transparent core.

The analytics engine should support:

### Return computation

* compute simple daily returns from close prices
* handle missing prior values safely
* align assets on a consistent date index

### Portfolio return computation

* combine asset returns using target weights
* support fixed-weight portfolios
* support periodic rebalancing
* if an asset lacks data in part of the range, use a documented policy

### Rebalancing rules

Supported modes:

* none
* monthly
* quarterly

Behavior:

* weights drift between rebalances
* on rebalance dates, portfolio resets to target weights

### Summary metrics

At minimum:

* total return
* annualized return
* annualized volatility
* Sharpe ratio using a simple configurable risk-free rate or zero for MVP
* max drawdown
* best day
* worst day
* number of observations

### Benchmark logic

If a benchmark is selected:

* compute benchmark cumulative performance over the same date range
* display side-by-side values
* include comparison chart

### Assumption transparency

The user should be able to understand:

* what date range was used
* what rebalance rule was applied
* what assets were included
* whether missing data reduced the usable range

---

## 12. UX Requirements

The UI should feel clean, modern, and analytical.

### Primary pages

* landing page
* login / register
* dashboard
* datasets page
* portfolio list page
* portfolio detail / edit page
* new backtest page
* backtest result page
* comparison page
* settings page optional

### UX principles

* no cluttered trader-terminal look
* prioritize readability
* use clear labels and modest financial terminology
* show useful empty states
* show validation errors early
* guide the user toward successful first use

### Important UX flows

#### Flow 1: First-time setup

1. user signs up
2. user uploads a CSV
3. user previews the dataset
4. user completes import
5. user creates a portfolio
6. user runs a backtest
7. user sees results

This should be the most polished path in the product.

#### Flow 2: Edit and rerun

1. user edits weights
2. user reruns the backtest
3. user compares new result to previous run

#### Flow 3: Compare strategies

1. user selects multiple backtests
2. user views overlaid results
3. user inspects summary metric differences

---

## 13. Data Validation Rules

Validation should be strict enough to prevent silent garbage.

### CSV validation rules

* required columns must exist
* date must parse correctly
* symbol must be non-empty
* close must be numeric and positive
* duplicate rows should be handled deterministically
* unsupported rows should produce understandable import feedback

### Portfolio validation rules

* portfolio must have at least one holding
* weights must be numeric
* weights must sum to 100% within a small tolerance
* duplicate asset entries in the same portfolio should be prevented

### Backtest validation rules

* start date must be before end date
* all required assets must have data covering the selected range or the system must clearly restrict the actual usable range
* initial capital must be positive
* rebalance frequency must be valid

---

## 14. Error Handling Philosophy

The app should fail clearly, not mysteriously.

Examples:

* if CSV parsing fails, show exactly which column or rows are invalid
* if a portfolio cannot be backtested because of missing data, explain which symbols or dates are problematic
* if a benchmark is invalid, the backtest form should reject it early
* if computation fails, do not show a blank chart with no context

Do not over-engineer impossible-edge-case handling. Focus on realistic failure modes.

---

## 15. Quality Standards

The project should demonstrate disciplined engineering, not only functional output.

### Code quality expectations

* typed interfaces
* modular domain logic
* no giant multi-purpose files
* no business logic hidden inside UI components
* no speculative abstractions
* readable naming
* small, reviewable commits or task units

### UI quality expectations

* consistent spacing and typography
* clean card layout for metrics
* charts that are readable and not overloaded
* responsive enough for laptop and tablet widths
* accessible forms and buttons

### Testing expectations

At minimum:

* analytics engine has unit tests
* dataset parsing has validation tests
* portfolio weight validation has tests
* at least one full happy-path end-to-end flow exists

---

## 16. Security and Privacy Baseline

This is not a security-heavy product, but basic hygiene is required.

Requirements:

* authenticated routes protected
* user data isolated
* file uploads validated
* no raw SQL built from unsanitized input
* secrets handled through environment variables
* no client exposure of sensitive backend data

Non-requirements for MVP:

* audit trails
* advanced rate limiting
* enterprise-grade compliance features

---

## 17. Performance Expectations

The project should feel responsive for moderate personal use.

Target assumptions:

* dozens of assets
* thousands of daily price rows
* multiple saved portfolios
* multiple saved backtest runs per user

The MVP does not need to support institutional-scale data.

Practical expectations:

* CSV preview should not freeze the UI
* a normal backtest should complete quickly
* charts should render smoothly for realistic dataset sizes
* expensive computations should be isolated from presentational layers

---

## 18. Suggested Delivery Phases

The project should be built in phases so agents can make steady measurable progress.

## Phase 1: Repository and foundation

Deliver:

* repository setup
* linting and formatting
* basic auth
* database schema skeleton
* UI shell
* memory layer and agent workflow support

Success criteria:

* project runs locally
* user can register/login
* main pages exist as placeholders
* repository is ready for feature work

## Phase 2: Dataset import

Deliver:

* CSV upload flow
* validation
* preview
* persistence of assets and price records

Success criteria:

* user can upload a valid file and see imported assets
* invalid files are rejected clearly

## Phase 3: Portfolio builder

Deliver:

* create/edit/delete portfolio
* weight assignment and validation

Success criteria:

* user can build a valid portfolio from imported assets

## Phase 4: Backtest engine

Deliver:

* core analytics logic
* API or server computation path
* result persistence

Success criteria:

* user can run a backtest on a saved portfolio

## Phase 5: Results dashboard

Deliver:

* performance chart
* drawdown chart
* summary metrics
* benchmark comparison optional

Success criteria:

* results are understandable and visually clean

## Phase 6: Comparison and polish

Deliver:

* compare multiple backtests
* improved error states
* final UX polish
* test coverage improvements

Success criteria:

* application feels like a coherent product, not a set of disconnected screens

---

## 19. First Milestone Recommendation

The first meaningful milestone should not be “build the whole app.”

It should be:

**“Establish a clean repo foundation with auth, basic layout, database setup, and placeholders for datasets, portfolios, and backtests.”**

Why this first:

* it creates stable structure
* it reduces future rewrite risk
* it gives later tasks clear boundaries
* it is well-suited for multi-agent coordination

---

## 20. Suggested Initial Tasks

These are examples of the first realistic tasks the agent may execute after reading this project file.

### Task 1

Set up the repository structure, core tooling, linting, formatting, environment handling, and basic app shell.

### Task 2

Implement authentication and protected routing.

### Task 3

Create database schema for users, datasets, assets, portfolios, holdings, and backtest runs.

### Task 4

Implement dataset upload page with CSV preview and validation.

### Task 5

Implement portfolio creation flow with weight validation.

### Task 6

Build the first version of the backtest engine with unit tests.

---

## 21. Product Success Criteria

The project is successful when a user can:

1. sign up and log in
2. upload a valid price dataset
3. create a portfolio from imported assets
4. run a backtest with configurable dates and rebalance settings
5. view charts and performance metrics
6. save and revisit results
7. compare at least two portfolio runs

And when the codebase is:

* structured
* testable
* readable
* easy for another agent to continue

---

## 22. Example User Scenario

A user uploads a CSV containing daily close prices for SPY, QQQ, TLT, and GLD from 2018 to 2024.

They create a portfolio called “Balanced Growth” with:

* 40% SPY
* 30% QQQ
* 20% TLT
* 10% GLD

They run a backtest from January 1, 2019 to December 31, 2023 with monthly rebalancing and $10,000 initial capital.

The app returns:

* a portfolio value chart
* cumulative return
* annualized return
* volatility
* Sharpe ratio
* max drawdown
* best and worst day
* benchmark comparison against SPY

The user duplicates the portfolio, changes the weights, reruns, and compares both strategies.

That scenario should work smoothly in the completed project.

---

## 23. Design Philosophy

This product should feel like:

* serious but not intimidating
* analytical but not cluttered
* practical rather than academic
* polished enough to demo
* structured enough that multiple agents can build it incrementally

The application should avoid:

* fake complexity
* decorative dashboards with no real function
* exaggerated “AI finance terminal” aesthetics
* architecture that is more ambitious than the product requires

---

## 24. Final Build Intent

The final product should be a medium-complexity, realistically buildable full-stack portfolio analytics app that demonstrates:

* good product thinking
* disciplined software engineering
* meaningful quantitative functionality
* clear UI and UX
* manageable scope
* strong fit for an agent-driven development workflow

It should be complex enough to require planning and memory, but not so large that agents collapse into endless refactoring or speculative architecture.

---

## 25. Instruction to Future Implementing Agent

When preparing the repository and beginning work on this project:

* treat this file as the product specification
* extract milestones from it
* do not try to implement everything at once
* start with the first milestone
* prefer simple correct foundations over ambitious breadth
* maintain project memory and handoff quality throughout implementation

If the specification is underspecified in a local area, choose the smallest reasonable interpretation and document it clearly.

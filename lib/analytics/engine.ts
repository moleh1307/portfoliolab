export interface PriceData {
  date: string;
  close: number;
}

export interface AssetPrices {
  assetId: string;
  symbol: string;
  prices: PriceData[];
}

export interface PortfolioHolding {
  assetId: string;
  weight: number;
}

export type RebalanceFrequency = 'none' | 'monthly' | 'quarterly';

export interface BacktestConfig {
  holdings: PortfolioHolding[];
  startDate: string;
  endDate: string;
  initialCapital: number;
  rebalanceFrequency: RebalanceFrequency;
}

export interface DailyReturn {
  date: string;
  value: number;
  dailyReturn: number;
  cumulativeReturn: number;
  drawdown: number;
}

export interface BacktestResult {
  dataPoints: DailyReturn[];
  summary: SummaryMetrics;
  config: BacktestConfig;
}

export interface SummaryMetrics {
  totalReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bestDay: number;
  worstDay: number;
  numberOfObservations: number;
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

function isSameQuarter(date1: Date, date2: Date): boolean {
  const q1 = Math.floor(date1.getMonth() / 3);
  const q2 = Math.floor(date2.getMonth() / 3);
  return date1.getFullYear() === date2.getFullYear() && q1 === q2;
}

function isRebalanceDate(
  prevDate: Date | null,
  currentDate: Date,
  frequency: RebalanceFrequency
): boolean {
  if (frequency === 'none' || prevDate === null) {
    return frequency !== 'none';
  }
  switch (frequency) {
    case 'monthly':
      return !isSameMonth(prevDate, currentDate);
    case 'quarterly':
      return !isSameQuarter(prevDate, currentDate);
    default:
      return false;
  }
}

function computeDailyReturns(
  prices: PriceData[]
): { date: string; dailyReturn: number }[] {
  const sorted = [...prices].sort((a, b) => a.date.localeCompare(b.date));
  const returns: { date: string; dailyReturn: number }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prevClose = sorted[i - 1].close;
    const currClose = sorted[i].close;
    const dailyReturn = (currClose - prevClose) / prevClose;
    returns.push({
      date: sorted[i].date,
      dailyReturn,
    });
  }

  return returns;
}

export function runBacktest(
  assetPrices: AssetPrices[],
  config: BacktestConfig
): BacktestResult {
  const { holdings, startDate, endDate, initialCapital, rebalanceFrequency } = config;

  const assetPriceMap = new Map<string, PriceData[]>();
  for (const ap of assetPrices) {
    assetPriceMap.set(ap.assetId, ap.prices);
  }

  const allDatesSet = new Set<string>();
  for (const holding of holdings) {
    const prices = assetPriceMap.get(holding.assetId);
    if (!prices) continue;
    for (const p of prices) {
      if (p.date >= startDate && p.date <= endDate) {
        allDatesSet.add(p.date);
      }
    }
  }

  const allDates = Array.from(allDatesSet).sort();

  if (allDates.length === 0) {
    return {
      dataPoints: [],
      summary: {
        totalReturn: 0,
        annualizedReturn: 0,
        annualizedVolatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        bestDay: 0,
        worstDay: 0,
        numberOfObservations: 0,
      },
      config,
    };
  }

  const dailyReturnsMap = new Map<string, Map<string, number>>();
  for (const holding of holdings) {
    const prices = assetPriceMap.get(holding.assetId);
    if (!prices) continue;

    const filtered = prices.filter(p => p.date >= startDate && p.date <= endDate);
    const returns = computeDailyReturns(filtered);

    const assetReturns = new Map<string, number>();
    for (const r of returns) {
      assetReturns.set(r.date, r.dailyReturn);
    }
    dailyReturnsMap.set(holding.assetId, assetReturns);
  }

  const dataPoints: DailyReturn[] = [];
  let portfolioValue = initialCapital;
  let peakValue = initialCapital;
  let prevDate: Date | null = null;
  let cumulativeReturn = 0;

  const dailyReturns: number[] = [];

  for (const dateStr of allDates) {
    let portfolioDailyReturn = 0;
    let hasAllData = true;

    for (const holding of holdings) {
      const assetReturns = dailyReturnsMap.get(holding.assetId);
      if (!assetReturns) {
        hasAllData = false;
        break;
      }
      const dailyReturn = assetReturns.get(dateStr);
      if (dailyReturn === undefined) {
        hasAllData = false;
        break;
      }
      portfolioDailyReturn += holding.weight * dailyReturn;
    }

    if (!hasAllData) {
      continue;
    }

    const currentDate = parseDate(dateStr);
    const shouldRebalance = isRebalanceDate(prevDate, currentDate, rebalanceFrequency);

    if (shouldRebalance) {
      portfolioValue = portfolioValue * (1 + portfolioDailyReturn);
    } else {
      portfolioValue = portfolioValue * (1 + portfolioDailyReturn);
    }

    cumulativeReturn = (portfolioValue - initialCapital) / initialCapital;
    peakValue = Math.max(peakValue, portfolioValue);
    const drawdown = (peakValue - portfolioValue) / peakValue;

    dailyReturns.push(portfolioDailyReturn);

    dataPoints.push({
      date: dateStr,
      value: portfolioValue,
      dailyReturn: portfolioDailyReturn,
      cumulativeReturn,
      drawdown,
    });

    prevDate = currentDate;
  }

  const summary = computeSummaryMetrics(dailyReturns, initialCapital, dataPoints[dataPoints.length - 1]?.value || initialCapital);

  return {
    dataPoints,
    summary,
    config,
  };
}

function computeSummaryMetrics(
  dailyReturns: number[],
  initialCapital: number,
  finalValue: number
): SummaryMetrics {
  const n = dailyReturns.length;

  if (n === 0) {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      annualizedVolatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      bestDay: 0,
      worstDay: 0,
      numberOfObservations: 0,
    };
  }

  const totalReturn = (finalValue - initialCapital) / initialCapital;

  const avgDailyReturn = dailyReturns.reduce((a, b) => a + b, 0) / n;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / n;
  const dailyVolatility = Math.sqrt(variance);
  const annualizedVolatility = dailyVolatility * Math.sqrt(252);

  const tradingDaysPerYear = 252;
  const years = n / tradingDaysPerYear;
  const annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1;

  const riskFreeRate = 0;
  const sharpeRatio = annualizedVolatility > 0
    ? (annualizedReturn - riskFreeRate) / annualizedVolatility
    : 0;

  const bestDay = n > 0 ? Math.max(...dailyReturns) : 0;
  const worstDay = n > 0 ? Math.min(...dailyReturns) : 0;

  return {
    totalReturn,
    annualizedReturn,
    annualizedVolatility,
    sharpeRatio,
    maxDrawdown: 0,
    bestDay,
    worstDay,
    numberOfObservations: n,
  };
}

export function computeMaxDrawdown(dataPoints: DailyReturn[]): number {
  let peak = dataPoints[0]?.value || 0;
  let maxDrawdown = 0;

  for (const dp of dataPoints) {
    peak = Math.max(peak, dp.value);
    const drawdown = (peak - dp.value) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  return maxDrawdown;
}

export function runBacktestWithBenchmark(
  assetPrices: AssetPrices[],
  benchmarkPrices: PriceData[],
  config: BacktestConfig
): BacktestResult & { benchmarkDataPoints: DailyReturn[] } {
  const result = runBacktest(assetPrices, config);

  result.summary.maxDrawdown = computeMaxDrawdown(result.dataPoints);

  const benchmarkReturns = computeDailyReturns(benchmarkPrices);
  const filteredBenchmarkReturns = benchmarkReturns.filter(
    r => r.date >= config.startDate && r.date <= config.endDate
  );

  let benchmarkValue = config.initialCapital;
  const benchmarkDataPoints: DailyReturn[] = [];
  let benchmarkPeak = config.initialCapital;
  let prevDate: Date | null = null;

  for (const r of filteredBenchmarkReturns) {
    const currentDate = parseDate(r.date);
    const shouldRebalance = isRebalanceDate(prevDate, currentDate, config.rebalanceFrequency);

    benchmarkValue = benchmarkValue * (1 + r.dailyReturn);

    const cumulativeReturn = (benchmarkValue - config.initialCapital) / config.initialCapital;
    benchmarkPeak = Math.max(benchmarkPeak, benchmarkValue);
    const drawdown = (benchmarkPeak - benchmarkValue) / benchmarkPeak;

    benchmarkDataPoints.push({
      date: r.date,
      value: benchmarkValue,
      dailyReturn: r.dailyReturn,
      cumulativeReturn,
      drawdown,
    });

    prevDate = currentDate;
  }

  return {
    ...result,
    benchmarkDataPoints,
  };
}

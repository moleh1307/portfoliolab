export interface BacktestResult {
  dataPoints: DailyReturn[];
  summary: SummaryMetrics;
  config: BacktestConfig;
}

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

export interface SummaryMetrics {
  totalReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  maxDrawdownDays: number;
  bestDay: number;
  worstDay: number;
  numberOfObservations: number;
  winRate: number;
  profitFactor: number;
  skewness: number;
  kurtosis: number;
  valueAtRisk95: number;
  conditionalVaR95: number;
  ulcerIndex: number;
  recoveryFactor: number;
  benchmarkReturn?: number;
  excessReturn?: number;
  beta?: number;
  alpha?: number;
  trackingError?: number;
  informationRatio?: number;
  correlation?: number;
}

export interface DrawdownEvent {
  startDate: string;
  endDate: string;
  recoveryDate: string | null;
  depth: number;
  duration: number;
  recoveryDays: number | null;
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
}

export interface BenchmarkMetrics {
  benchmarkReturns: number[];
  benchmarkTotalReturn: number;
  benchmarkAnnualizedReturn: number;
  benchmarkVolatility: number;
  benchmarkSharpe: number;
  benchmarkMaxDrawdown: number;
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

function computeMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function computeStdDev(arr: number[], sample = false): number {
  if (arr.length < 2) return 0;
  const mean = computeMean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (arr.length - (sample ? 1 : 0));
  return Math.sqrt(variance);
}

function computeSkewness(arr: number[]): number {
  const n = arr.length;
  if (n < 3) return 0;
  const mean = computeMean(arr);
  const std = computeStdDev(arr, true);
  if (std === 0) return 0;
  const skew = arr.reduce((sum, v) => sum + ((v - mean) / std) ** 3, 0) * n / ((n - 1) * (n - 2));
  return skew;
}

function computeKurtosis(arr: number[]): number {
  const n = arr.length;
  if (n < 4) return 0;
  const mean = computeMean(arr);
  const std = computeStdDev(arr, true);
  if (std === 0) return 0;
  const m4 = arr.reduce((sum, v) => sum + ((v - mean) / std) ** 4, 0) / n;
  return m4 - 3;
}

function computeVaR(returns: number[], confidence: number): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  return sorted[Math.max(0, index)];
}

function computeCVaR(returns: number[], confidence: number): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  const tail = sorted.slice(0, Math.max(1, index + 1));
  return computeMean(tail);
}

function computeMaxDrawdown(dataPoints: DailyReturn[]): number {
  let peak = dataPoints[0]?.value || 0;
  let maxDrawdown = 0;

  for (const dp of dataPoints) {
    peak = Math.max(peak, dp.value);
    const drawdown = (peak - dp.value) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  return maxDrawdown;
}

function computeDrawdownEvents(dataPoints: DailyReturn[]): DrawdownEvent[] {
  if (dataPoints.length === 0) return [];

  const events: DrawdownEvent[] = [];
  let peak = dataPoints[0].value;
  let peakDate = dataPoints[0].date;
  let inDrawdown = false;
  let currentStart = '';
  let currentDepth = 0;
  let currentMaxDepth = 0;

  for (let i = 0; i < dataPoints.length; i++) {
    const dp = dataPoints[i];
    if (dp.value > peak) {
      if (inDrawdown && currentMaxDepth > 0.001) {
        const startDate = currentStart;
        const endDate = dataPoints[i - 1]?.date || currentStart;
        const startIdx = dataPoints.findIndex(d => d.date === startDate);
        const endIdx = dataPoints.findIndex(d => d.date === endDate);
        events.push({
          startDate,
          endDate,
          recoveryDate: null,
          depth: currentMaxDepth,
          duration: endIdx - startIdx,
          recoveryDays: null,
        });
      }
      peak = dp.value;
      peakDate = dp.date;
      inDrawdown = false;
      currentMaxDepth = 0;
      continue;
    }

    const drawdown = (peak - dp.value) / peak;
    if (drawdown > 0.001) {
      if (!inDrawdown) {
        inDrawdown = true;
        currentStart = peakDate;
        currentMaxDepth = drawdown;
      } else {
        currentMaxDepth = Math.max(currentMaxDepth, drawdown);
      }
    }
  }

  if (inDrawdown && currentMaxDepth > 0.001) {
    const endIdx = dataPoints.length - 1;
    const startIdx = dataPoints.findIndex(d => d.date === currentStart);
    events.push({
      startDate: currentStart,
      endDate: dataPoints[endIdx].date,
      recoveryDate: null,
      depth: currentMaxDepth,
      duration: endIdx - startIdx,
      recoveryDays: null,
    });
  }

  return events.sort((a, b) => b.depth - a.depth);
}

function computeMaxDrawdownDays(dataPoints: DailyReturn[]): number {
  if (dataPoints.length === 0) return 0;

  let peak = dataPoints[0].value;
  let maxDdDays = 0;
  let ddStart = 0;
  let inDrawdown = false;

  for (let i = 0; i < dataPoints.length; i++) {
    const dp = dataPoints[i];
    if (dp.value > peak) {
      if (inDrawdown) {
        maxDdDays = Math.max(maxDdDays, i - ddStart);
      }
      peak = dp.value;
      inDrawdown = false;
      continue;
    }

    const drawdown = (peak - dp.value) / peak;
    if (drawdown > 0.001 && !inDrawdown) {
      inDrawdown = true;
      ddStart = i;
    }
  }

  if (inDrawdown) {
    maxDdDays = Math.max(maxDdDays, dataPoints.length - 1 - ddStart);
  }

  return maxDdDays;
}

function computeMonthlyReturns(dataPoints: DailyReturn[]): MonthlyReturn[] {
  const monthlyMap = new Map<string, { startValue: number; endValue: number }>();

  for (const dp of dataPoints) {
    const date = new Date(dp.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthlyMap.get(key);
    if (!existing) {
      monthlyMap.set(key, { startValue: dp.value, endValue: dp.value });
    } else {
      existing.endValue = dp.value;
    }
  }

  const monthlyReturns: MonthlyReturn[] = [];
  Array.from(monthlyMap.entries()).forEach(([key, values]) => {
    const [yearStr, monthStr] = key.split('-');
    monthlyReturns.push({
      year: parseInt(yearStr),
      month: parseInt(monthStr),
      return: (values.endValue - values.startValue) / values.startValue,
    });
  });

  return monthlyReturns.sort((a, b) => a.year - b.year || a.month - b.month);
}

function computeUlcerIndex(dataPoints: DailyReturn[]): number {
  if (dataPoints.length === 0) return 0;
  const squaredDrawdowns = dataPoints.map(dp => dp.drawdown ** 2);
  return Math.sqrt(computeMean(squaredDrawdowns));
}

function computeBenchmarkMetrics(
  benchmarkReturns: number[],
  benchmarkDataPoints: DailyReturn[]
): BenchmarkMetrics {
  const n = benchmarkReturns.length;
  if (n === 0) {
    return {
      benchmarkReturns: [],
      benchmarkTotalReturn: 0,
      benchmarkAnnualizedReturn: 0,
      benchmarkVolatility: 0,
      benchmarkSharpe: 0,
      benchmarkMaxDrawdown: 0,
    };
  }

  const finalValue = benchmarkDataPoints[benchmarkDataPoints.length - 1]?.value || 0;
  const initialValue = benchmarkDataPoints[0]?.value || 0;
  const totalReturn = (finalValue - initialValue) / initialValue;
  const years = n / 252;
  const annualizedReturn = Math.pow(1 + totalReturn, 1 / years) - 1;
  const volatility = computeStdDev(benchmarkReturns) * Math.sqrt(252);
  const sharpe = volatility > 0 ? annualizedReturn / volatility : 0;
  const maxDD = computeMaxDrawdown(benchmarkDataPoints);

  return {
    benchmarkReturns,
    benchmarkTotalReturn: totalReturn,
    benchmarkAnnualizedReturn: annualizedReturn,
    benchmarkVolatility: volatility,
    benchmarkSharpe: sharpe,
    benchmarkMaxDrawdown: maxDD,
  };
}

function computeBenchmarkRelativeMetrics(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  dataPoints: DailyReturn[],
  benchmarkDataPoints: DailyReturn[]
): Partial<SummaryMetrics> {
  const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (minLength === 0) return {};

  const alignedPortfolio = portfolioReturns.slice(0, minLength);
  const alignedBenchmark = benchmarkReturns.slice(0, minLength);

  const excessReturns = alignedPortfolio.map((r, i) => r - alignedBenchmark[i]);
  const avgExcess = computeMean(excessReturns);
  const annualizedExcess = avgExcess * 252;
  const trackingError = computeStdDev(excessReturns) * Math.sqrt(252);
  const informationRatio = trackingError > 0 ? annualizedExcess / trackingError : 0;

  const benchMean = computeMean(alignedBenchmark);
  const benchVar = alignedBenchmark.reduce((s, r) => s + (r - benchMean) ** 2, 0) / minLength;
  const covar = alignedPortfolio.reduce((s, r, i) => s + (r - computeMean(alignedPortfolio)) * (alignedBenchmark[i] - benchMean), 0) / minLength;
  const beta = benchVar > 0 ? covar / benchVar : 0;

  const portTotalReturn = (dataPoints[dataPoints.length - 1]?.value - dataPoints[0]?.value) / dataPoints[0]?.value;
  const benchTotalReturn = (benchmarkDataPoints[benchmarkDataPoints.length - 1]?.value - benchmarkDataPoints[0]?.value) / benchmarkDataPoints[0]?.value;
  const years = minLength / 252;
  const portAnn = Math.pow(1 + portTotalReturn, 1 / years) - 1;
  const benchAnn = Math.pow(1 + benchTotalReturn, 1 / years) - 1;
  const alpha = portAnn - (0 + beta * (benchAnn - 0));

  const correlation = benchVar > 0 && computeStdDev(alignedPortfolio) > 0
    ? covar / (computeStdDev(alignedBenchmark) * computeStdDev(alignedPortfolio))
    : 0;

  return {
    benchmarkReturn: benchTotalReturn,
    excessReturn: portTotalReturn - benchTotalReturn,
    beta,
    alpha,
    trackingError,
    informationRatio,
    correlation,
  };
}

export function runBacktest(
  assetPrices: AssetPrices[],
  config: BacktestConfig
): BacktestResult & {
  summary: SummaryMetrics;
  drawdownEvents: DrawdownEvent[];
  monthlyReturns: MonthlyReturn[];
} {
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
        totalReturn: 0, annualizedReturn: 0, annualizedVolatility: 0,
        sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0,
        maxDrawdown: 0, maxDrawdownDays: 0,
        bestDay: 0, worstDay: 0, numberOfObservations: 0,
        winRate: 0, profitFactor: 0,
        skewness: 0, kurtosis: 0,
        valueAtRisk95: 0, conditionalVaR95: 0,
        ulcerIndex: 0, recoveryFactor: 0,
      },
      config,
      drawdownEvents: [],
      monthlyReturns: [],
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
  let prevDate: Date | null = null;
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

    portfolioValue = portfolioValue * (1 + portfolioDailyReturn);

    const cumulativeReturn = (portfolioValue - initialCapital) / initialCapital;

    const peakValue = dataPoints.length > 0
      ? Math.max(...dataPoints.map(dp => dp.value), initialCapital)
      : Math.max(initialCapital, portfolioValue);
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

  const summary = computeSummaryMetrics(dailyReturns, initialCapital, dataPoints[dataPoints.length - 1]);
  const drawdownEvents = computeDrawdownEvents(dataPoints);
  const monthlyReturns = computeMonthlyReturns(dataPoints);

  return {
    dataPoints,
    summary,
    config,
    drawdownEvents,
    monthlyReturns,
  };
}

function computeSummaryMetrics(
  dailyReturns: number[],
  initialCapital: number,
  finalDataPoint: DailyReturn | undefined
): SummaryMetrics {
  const n = dailyReturns.length;
  const finalValue = finalDataPoint?.value || initialCapital;

  if (n === 0) {
    return {
      totalReturn: 0, annualizedReturn: 0, annualizedVolatility: 0,
      sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0,
      maxDrawdown: 0, maxDrawdownDays: 0,
      bestDay: 0, worstDay: 0, numberOfObservations: 0,
      winRate: 0, profitFactor: 0,
      skewness: 0, kurtosis: 0,
      valueAtRisk95: 0, conditionalVaR95: 0,
      ulcerIndex: 0, recoveryFactor: 0,
    };
  }

  const totalReturn = (finalValue - initialCapital) / initialCapital;
  const avgDailyReturn = computeMean(dailyReturns);
  const dailyVolatility = computeStdDev(dailyReturns);
  const annualizedVolatility = dailyVolatility * Math.sqrt(252);

  const tradingDaysPerYear = 252;
  const years = n / tradingDaysPerYear;
  const annualizedReturn = years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;

  const riskFreeRate = 0;
  const sharpeRatio = annualizedVolatility > 0
    ? (annualizedReturn - riskFreeRate) / annualizedVolatility
    : 0;

  const downsideReturns = dailyReturns.filter(r => r < 0);
  const downsideDeviation = downsideReturns.length > 0
    ? Math.sqrt(downsideReturns.reduce((s, r) => s + r ** 2, 0) / n) * Math.sqrt(252)
    : 0;
  const sortinoRatio = downsideDeviation > 0
    ? (annualizedReturn - riskFreeRate) / downsideDeviation
    : 0;

  const maxDrawdown = computeMaxDrawdownForReturns(dailyReturns);
  const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

  const positiveReturns = dailyReturns.filter(r => r > 0);
  const negativeReturns = dailyReturns.filter(r => r < 0);
  const winRate = positiveReturns.length / n;

  const grossProfit = positiveReturns.reduce((s, r) => s + r, 0);
  const grossLoss = Math.abs(negativeReturns.reduce((s, r) => s + r, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const skewness = computeSkewness(dailyReturns);
  const kurtosis = computeKurtosis(dailyReturns);

  const var95 = computeVaR(dailyReturns, 0.95);
  const cvar95 = computeCVaR(dailyReturns, 0.95);

  const ulcerIndex = computeUlcerIndexFromReturns(dailyReturns);

  const recoveryFactor = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;

  return {
    totalReturn,
    annualizedReturn,
    annualizedVolatility,
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    maxDrawdown,
    maxDrawdownDays: 0,
    bestDay: Math.max(...dailyReturns),
    worstDay: Math.min(...dailyReturns),
    numberOfObservations: n,
    winRate,
    profitFactor: profitFactor === Infinity ? 999 : profitFactor,
    skewness,
    kurtosis,
    valueAtRisk95: var95,
    conditionalVaR95: cvar95,
    ulcerIndex,
    recoveryFactor,
  };
}

function computeMaxDrawdownForReturns(returns: number[]): number {
  let peak = 1;
  let maxDD = 0;
  let cumulative = 1;

  for (const r of returns) {
    cumulative *= (1 + r);
    peak = Math.max(peak, cumulative);
    const dd = (peak - cumulative) / peak;
    maxDD = Math.max(maxDD, dd);
  }

  return maxDD;
}

function computeUlcerIndexFromReturns(returns: number[]): number {
  let peak = 1;
  let cumulative = 1;
  const drawdowns: number[] = [];

  for (const r of returns) {
    cumulative *= (1 + r);
    peak = Math.max(peak, cumulative);
    drawdowns.push((peak - cumulative) / peak);
  }

  const squaredDD = drawdowns.map(dd => dd ** 2);
  return Math.sqrt(computeMean(squaredDD));
}

export function runBacktestWithBenchmark(
  assetPrices: AssetPrices[],
  benchmarkPrices: PriceData[],
  config: BacktestConfig
): BacktestResult & {
  summary: SummaryMetrics;
  benchmarkDataPoints: DailyReturn[];
  benchmarkMetrics: BenchmarkMetrics;
  drawdownEvents: DrawdownEvent[];
  monthlyReturns: MonthlyReturn[];
} {
  const result = runBacktest(assetPrices, config);

  const benchmarkReturns = computeDailyReturns(benchmarkPrices);
  const filteredBenchmarkReturns = benchmarkReturns.filter(
    r => r.date >= config.startDate && r.date <= config.endDate
  );

  let benchmarkValue = config.initialCapital;
  const benchmarkDataPoints: DailyReturn[] = [];

  for (const r of filteredBenchmarkReturns) {
    benchmarkValue = benchmarkValue * (1 + r.dailyReturn);
    const cumulativeReturn = (benchmarkValue - config.initialCapital) / config.initialCapital;

    const peakValue = benchmarkDataPoints.length > 0
      ? Math.max(...benchmarkDataPoints.map(dp => dp.value), config.initialCapital)
      : Math.max(config.initialCapital, benchmarkValue);
    const drawdown = (peakValue - benchmarkValue) / peakValue;

    benchmarkDataPoints.push({
      date: r.date,
      value: benchmarkValue,
      dailyReturn: r.dailyReturn,
      cumulativeReturn,
      drawdown,
    });
  }

  const benchmarkMetrics = computeBenchmarkMetrics(
    filteredBenchmarkReturns.map(r => r.dailyReturn),
    benchmarkDataPoints
  );

  const relativeMetrics = computeBenchmarkRelativeMetrics(
    result.dataPoints.map(dp => dp.dailyReturn),
    filteredBenchmarkReturns.map(r => r.dailyReturn),
    result.dataPoints,
    benchmarkDataPoints
  );

  Object.assign(result.summary, relativeMetrics);

  return {
    ...result,
    benchmarkDataPoints,
    benchmarkMetrics,
  };
}

export interface RollingDataPoint {
  date: string;
  rollingReturn: number;
  rollingVolatility: number;
  rollingSharpe: number;
  rollingBeta: number | null;
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

export function computeCorrelationMatrix(
  assetPrices: AssetPrices[],
  startDate: string,
  endDate: string
): CorrelationMatrix {
  const returnsMap = new Map<string, number[]>();
  const dates: string[] = [];

  for (const ap of assetPrices) {
    const filtered = ap.prices.filter(p => p.date >= startDate && p.date <= endDate);
    if (filtered.length < 2) continue;

    const returns: number[] = [];
    for (let i = 1; i < filtered.length; i++) {
      const ret = (filtered[i].close - filtered[i - 1].close) / filtered[i - 1].close;
      returns.push(ret);
    }
    returnsMap.set(ap.symbol, returns);

    const assetDates = filtered.slice(1).map(p => p.date);
    if (dates.length === 0) {
      dates.push(...assetDates);
    }
  }

  if (returnsMap.size === 0) {
    return { symbols: [], matrix: [] };
  }

  const symbols = Array.from(returnsMap.keys());
  const n = symbols.length;

  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
        continue;
      }
      if (j < i) {
        matrix[i][j] = matrix[j][i];
        continue;
      }

      const returnsA = returnsMap.get(symbols[i])!;
      const returnsB = returnsMap.get(symbols[j])!;
      const len = Math.min(returnsA.length, returnsB.length);
      if (len < 2) continue;

      const meanA = computeMean(returnsA.slice(0, len));
      const meanB = computeMean(returnsB.slice(0, len));

      let covar = 0;
      let stdA = 0;
      let stdB = 0;
      for (let k = 0; k < len; k++) {
        const diffA = returnsA[k] - meanA;
        const diffB = returnsB[k] - meanB;
        covar += diffA * diffB;
        stdA += diffA * diffA;
        stdB += diffB * diffB;
      }

      const denom = Math.sqrt(stdA * stdB);
      matrix[i][j] = denom > 0 ? covar / denom : 0;
    }
  }

  return { symbols, matrix };
}

export interface PortfolioAllocation {
  weights: number[];
  symbols: string[];
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
}

export interface EfficientFrontierPoint {
  volatility: number;
  expectedReturn: number;
  sharpeRatio: number;
  weights: number[];
}

export interface OptimizationResult {
  minimumVariance: PortfolioAllocation;
  maximumSharpe: PortfolioAllocation;
  efficientFrontier: EfficientFrontierPoint[];
  symbols: string[];
}

function computePortfolioMetrics(
  weights: number[],
  expectedReturns: number[],
  covMatrix: number[][]
): { expectedReturn: number; volatility: number; sharpeRatio: number } {
  const n = weights.length;
  const portReturn = weights.reduce((s, w, i) => s + w * expectedReturns[i], 0);
  let portVar = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portVar += weights[i] * weights[j] * covMatrix[i][j];
    }
  }
  const portVol = Math.sqrt(Math.max(0, portVar));
  const sharpe = portVol > 0 ? portReturn / portVol : 0;
  return { expectedReturn: portReturn, volatility: portVol, sharpeRatio: sharpe };
}

function randomWeights(n: number): number[] {
  const raw = Array.from({ length: n }, () => Math.random());
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map(w => w / sum);
}

function perturbWeights(weights: number[], intensity: number): number[] {
  const n = weights.length;
  const perturbed = weights.map(w => Math.max(0, w + (Math.random() - 0.5) * intensity));
  const sum = perturbed.reduce((a, b) => a + b, 0);
  return perturbed.map(w => w / sum);
}

export function optimizePortfolio(
  assetPrices: AssetPrices[],
  startDate: string,
  endDate: string,
  iterations: number = 5000
): OptimizationResult | null {
  if (assetPrices.length < 2) return null;

  const returnsMap = new Map<string, number[]>();
  const symbols: string[] = [];

  for (const ap of assetPrices) {
    const filtered = ap.prices.filter(p => p.date >= startDate && p.date <= endDate);
    if (filtered.length < 10) continue;

    const returns: number[] = [];
    for (let i = 1; i < filtered.length; i++) {
      returns.push((filtered[i].close - filtered[i - 1].close) / filtered[i - 1].close);
    }
    returnsMap.set(ap.symbol, returns);
    symbols.push(ap.symbol);
  }

  const n = symbols.length;
  if (n < 2) return null;

  const minLen = Math.min(...symbols.map(s => returnsMap.get(s)!.length));
  const returnsMatrix: number[][] = symbols.map(s => returnsMap.get(s)!.slice(0, minLen));

  const expectedReturns = returnsMatrix.map(r => computeMean(r) * 252);

  const covMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const meanI = computeMean(returnsMatrix[i]);
      const meanJ = computeMean(returnsMatrix[j]);
      let cov = 0;
      for (let k = 0; k < minLen; k++) {
        cov += (returnsMatrix[i][k] - meanI) * (returnsMatrix[j][k] - meanJ);
      }
      covMatrix[i][j] = (cov / (minLen - 1)) * 252;
    }
  }

  let minVarWeights = randomWeights(n);
  let minVarVol = Infinity;
  let maxSharpeWeights = randomWeights(n);
  let maxSharpe = -Infinity;

  const frontierPoints: { volatility: number; expectedReturn: number; sharpeRatio: number; weights: number[] }[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    const weights = randomWeights(n);
    const metrics = computePortfolioMetrics(weights, expectedReturns, covMatrix);

    if (metrics.volatility < minVarVol) {
      minVarVol = metrics.volatility;
      minVarWeights = [...weights];
    }

    if (metrics.sharpeRatio > maxSharpe) {
      maxSharpe = metrics.sharpeRatio;
      maxSharpeWeights = [...weights];
    }

    if (iter % 50 === 0) {
      frontierPoints.push({
        volatility: metrics.volatility,
        expectedReturn: metrics.expectedReturn,
        sharpeRatio: metrics.sharpeRatio,
        weights: [...weights],
      });
    }

    const currentWeights = iter % 2 === 0 ? [...minVarWeights] : [...maxSharpeWeights];
    const perturbed = perturbWeights(currentWeights, 0.3);
    const pertMetrics = computePortfolioMetrics(perturbed, expectedReturns, covMatrix);

    if (pertMetrics.volatility < minVarVol) {
      minVarVol = pertMetrics.volatility;
      minVarWeights = [...perturbed];
    }

    if (pertMetrics.sharpeRatio > maxSharpe) {
      maxSharpe = pertMetrics.sharpeRatio;
      maxSharpeWeights = [...perturbed];
    }
  }

  const minVarMetrics = computePortfolioMetrics(minVarWeights, expectedReturns, covMatrix);
  const maxSharpeMetrics = computePortfolioMetrics(maxSharpeWeights, expectedReturns, covMatrix);

  frontierPoints.sort((a, b) => a.volatility - b.volatility);

  return {
    minimumVariance: {
      weights: minVarWeights.map(w => w * 100),
      symbols,
      expectedReturn: minVarMetrics.expectedReturn,
      volatility: minVarMetrics.volatility,
      sharpeRatio: minVarMetrics.sharpeRatio,
    },
    maximumSharpe: {
      weights: maxSharpeWeights.map(w => w * 100),
      symbols,
      expectedReturn: maxSharpeMetrics.expectedReturn,
      volatility: maxSharpeMetrics.volatility,
      sharpeRatio: maxSharpeMetrics.sharpeRatio,
    },
    efficientFrontier: frontierPoints,
    symbols,
  };
}

export interface RiskDecomposition {
  symbols: string[];
  weights: number[];
  marginalRisk: number[];
  componentRisk: number[];
  pctContribution: number[];
  portfolioVolatility: number;
}

export function computeRiskDecomposition(
  assetPrices: AssetPrices[],
  holdings: PortfolioHolding[],
  startDate: string,
  endDate: string
): RiskDecomposition | null {
  const returnsMap = new Map<string, number[]>();
  const alignedSymbols: string[] = [];
  const alignedWeights: number[] = [];

  for (const holding of holdings) {
    const prices = assetPrices.find(ap => ap.assetId === holding.assetId);
    if (!prices || prices.prices.length < 2) continue;

    const filtered = prices.prices.filter(p => p.date >= startDate && p.date <= endDate);
    if (filtered.length < 2) continue;

    const returns: number[] = [];
    for (let i = 1; i < filtered.length; i++) {
      returns.push((filtered[i].close - filtered[i - 1].close) / filtered[i - 1].close);
    }
    returnsMap.set(prices.symbol, returns);
    alignedSymbols.push(prices.symbol);
    alignedWeights.push(holding.weight / 100);
  }

  if (alignedSymbols.length < 2) return null;

  const n = alignedSymbols.length;
  const minLen = Math.min(...alignedSymbols.map(s => returnsMap.get(s)!.length));

  const returnsMatrix: number[][] = alignedSymbols.map(s => returnsMap.get(s)!.slice(0, minLen));

  const covMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const meanI = computeMean(returnsMatrix[i]);
      const meanJ = computeMean(returnsMatrix[j]);
      let cov = 0;
      for (let k = 0; k < minLen; k++) {
        cov += (returnsMatrix[i][k] - meanI) * (returnsMatrix[j][k] - meanJ);
      }
      covMatrix[i][j] = (cov / (minLen - 1)) * 252;
    }
  }

  const portVar = alignedWeights.reduce((sum, wi, i) =>
    sum + alignedWeights.reduce((s2, wj, j) => s2 + wj * covMatrix[i][j], 0) * wi, 0
  );
  const portVol = Math.sqrt(Math.max(0, portVar));

  const marginalRisk: number[] = alignedWeights.map((_, i) => {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += alignedWeights[j] * covMatrix[i][j];
    }
    return portVol > 0 ? sum / portVol : 0;
  });

  const componentRisk = alignedWeights.map((w, i) => w * marginalRisk[i]);
  const totalComponentRisk = componentRisk.reduce((a, b) => a + b, 0);
  const pctContribution = totalComponentRisk > 0
    ? componentRisk.map(c => c / totalComponentRisk)
    : Array(n).fill(0);

  return {
    symbols: alignedSymbols,
    weights: alignedWeights.map(w => w * 100),
    marginalRisk,
    componentRisk,
    pctContribution,
    portfolioVolatility: portVol,
  };
}

export function computeRollingMetrics(
  dataPoints: DailyReturn[],
  window: number,
  benchmarkDataPoints?: DailyReturn[]
): RollingDataPoint[] {
  if (dataPoints.length < window) return [];

  const results: RollingDataPoint[] = [];

  for (let i = window - 1; i < dataPoints.length; i++) {
    const windowReturns = dataPoints.slice(i - window + 1, i + 1).map(dp => dp.dailyReturn);

    const cumulativeReturn = windowReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
    const annualizedReturn = Math.pow(1 + cumulativeReturn, 252 / window) - 1;
    const volatility = computeStdDev(windowReturns) * Math.sqrt(252);
    const sharpe = volatility > 0 ? annualizedReturn / volatility : 0;

    let beta: number | null = null;
    if (benchmarkDataPoints && benchmarkDataPoints.length > i) {
      const benchWindowReturns = benchmarkDataPoints.slice(i - window + 1, i + 1).map(dp => dp.dailyReturn);
      if (benchWindowReturns.length === window) {
        const benchMean = computeMean(benchWindowReturns);
        const portMean = computeMean(windowReturns);
        const benchVar = benchWindowReturns.reduce((s, r) => s + (r - benchMean) ** 2, 0) / window;
        const covar = windowReturns.reduce((s, r, j) => s + (r - portMean) * (benchWindowReturns[j] - benchMean), 0) / window;
        beta = benchVar > 0 ? covar / benchVar : 0;
      }
    }

    results.push({
      date: dataPoints[i].date,
      rollingReturn: annualizedReturn,
      rollingVolatility: volatility,
      rollingSharpe: sharpe,
      rollingBeta: beta,
    });
  }

  return results;
}

export { computeMonthlyReturns, computeDrawdownEvents, computeMaxDrawdown };

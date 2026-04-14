import { describe, it, expect } from 'vitest';
import {
  runBacktest,
  runBacktestWithBenchmark,
  computeMaxDrawdown,
  type PriceData,
  type AssetPrices,
  type BacktestConfig,
} from '../lib/analytics/engine';

function createPriceData(dates: string[], closes: number[]): PriceData[] {
  return dates.map((date, i) => ({ date, close: closes[i] }));
}

function createAssetPrices(assetId: string, symbol: string, dates: string[], closes: number[]): AssetPrices {
  return {
    assetId,
    symbol,
    prices: createPriceData(dates, closes),
  };
}

describe('Analytics Engine', () => {
  describe('runBacktest', () => {
    it('should compute correct returns for a single asset', () => {
      const assetPrices = [
        createAssetPrices('a1', 'AAPL', ['2024-01-01', '2024-01-02', '2024-01-03'], [100, 110, 121]),
      ];

      const config: BacktestConfig = {
        holdings: [{ assetId: 'a1', weight: 1 }],
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        initialCapital: 1000,
        rebalanceFrequency: 'none',
      };

      const result = runBacktest(assetPrices, config);

      expect(result.dataPoints).toHaveLength(2);
      expect(result.dataPoints[0].dailyReturn).toBeCloseTo(0.1, 5);
      expect(result.dataPoints[1].dailyReturn).toBeCloseTo(0.1, 5);
      expect(result.summary.totalReturn).toBeCloseTo(0.21, 5);
      expect(result.summary.numberOfObservations).toBe(2);
    });

    it('should compute correct weighted returns for multiple assets', () => {
      const assetPrices = [
        createAssetPrices('a1', 'AAPL', ['2024-01-01', '2024-01-02'], [100, 110]),
        createAssetPrices('a2', 'MSFT', ['2024-01-01', '2024-01-02'], [100, 105]),
      ];

      const config: BacktestConfig = {
        holdings: [
          { assetId: 'a1', weight: 0.5 },
          { assetId: 'a2', weight: 0.5 },
        ],
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        initialCapital: 1000,
        rebalanceFrequency: 'none',
      };

      const result = runBacktest(assetPrices, config);

      expect(result.dataPoints).toHaveLength(1);
      const expectedReturn = 0.5 * 0.1 + 0.5 * 0.05;
      expect(result.dataPoints[0].dailyReturn).toBeCloseTo(expectedReturn, 5);
    });

    it('should handle monthly rebalancing', () => {
      const assetPrices = [
        createAssetPrices('a1', 'AAPL', ['2024-01-01', '2024-01-31', '2024-02-01'], [100, 110, 121]),
      ];

      const config: BacktestConfig = {
        holdings: [{ assetId: 'a1', weight: 1 }],
        startDate: '2024-01-01',
        endDate: '2024-02-01',
        initialCapital: 1000,
        rebalanceFrequency: 'monthly',
      };

      const result = runBacktest(assetPrices, config);

      expect(result.dataPoints.length).toBeGreaterThan(0);
    });

    it('should return empty result when no dates match', () => {
      const assetPrices = [
        createAssetPrices('a1', 'AAPL', ['2024-01-01', '2024-01-02'], [100, 110]),
      ];

      const config: BacktestConfig = {
        holdings: [{ assetId: 'a1', weight: 1 }],
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        initialCapital: 1000,
        rebalanceFrequency: 'none',
      };

      const result = runBacktest(assetPrices, config);

      expect(result.dataPoints).toHaveLength(0);
      expect(result.summary.numberOfObservations).toBe(0);
    });

    it('should handle missing price data for some assets', () => {
      const assetPrices = [
        createAssetPrices('a1', 'AAPL', ['2024-01-01', '2024-01-02', '2024-01-03'], [100, 110, 121]),
        createAssetPrices('a2', 'MSFT', ['2024-01-01', '2024-01-03'], [100, 110]),
      ];

      const config: BacktestConfig = {
        holdings: [
          { assetId: 'a1', weight: 0.5 },
          { assetId: 'a2', weight: 0.5 },
        ],
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        initialCapital: 1000,
        rebalanceFrequency: 'none',
      };

      const result = runBacktest(assetPrices, config);

      expect(result.dataPoints).toHaveLength(1);
    });
  });

  describe('computeMaxDrawdown', () => {
    it('should compute correct max drawdown', () => {
      const dataPoints = [
        { date: '2024-01-01', value: 1000, dailyReturn: 0, cumulativeReturn: 0, drawdown: 0 },
        { date: '2024-01-02', value: 1100, dailyReturn: 0.1, cumulativeReturn: 0.1, drawdown: 0 },
        { date: '2024-01-03', value: 900, dailyReturn: -0.18, cumulativeReturn: -0.1, drawdown: 0.18 },
        { date: '2024-01-04', value: 1050, dailyReturn: 0.167, cumulativeReturn: 0.05, drawdown: 0.045 },
      ];

      const maxDrawdown = computeMaxDrawdown(dataPoints);

      expect(maxDrawdown).toBeCloseTo(0.1818, 3);
    });

    it('should return 0 for empty data', () => {
      const maxDrawdown = computeMaxDrawdown([]);
      expect(maxDrawdown).toBe(0);
    });
  });

  describe('runBacktestWithBenchmark', () => {
    it('should compute benchmark alongside portfolio', () => {
      const assetPrices = [
        createAssetPrices('a1', 'SPY', ['2024-01-01', '2024-01-02', '2024-01-03'], [100, 110, 121]),
      ];

      const benchmarkPrices = createPriceData(['2024-01-01', '2024-01-02', '2024-01-03'], [100, 105, 115]);

      const config: BacktestConfig = {
        holdings: [{ assetId: 'a1', weight: 1 }],
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        initialCapital: 1000,
        rebalanceFrequency: 'none',
      };

      const result = runBacktestWithBenchmark(assetPrices, benchmarkPrices, config);

      expect(result.benchmarkDataPoints).toHaveLength(2);
      expect(result.summary.totalReturn).toBeGreaterThan(0);
    });
  });

  describe('summary metrics', () => {
    it('should compute annualized volatility correctly', () => {
      const returns = [0.01, -0.005, 0.02, -0.01, 0.015];
      const prices = createPriceData(['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'], [100, 101, 100.5, 102.5, 101.5]);

      const assetPrices = [createAssetPrices('a1', 'AAPL', ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'], [100, 101, 100.5, 102.5, 101.5])];

      const config: BacktestConfig = {
        holdings: [{ assetId: 'a1', weight: 1 }],
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        initialCapital: 1000,
        rebalanceFrequency: 'none',
      };

      const result = runBacktest(assetPrices, config);

      expect(result.summary.annualizedVolatility).toBeGreaterThan(0);
      expect(result.summary.sharpeRatio).toBeDefined();
    });
  });
});

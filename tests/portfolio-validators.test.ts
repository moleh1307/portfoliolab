import { describe, it, expect } from 'vitest';
import {
  validateWeights,
  normalizeWeights,
  parseWeightInput,
} from '../lib/validators/portfolio';

describe('Portfolio Validators', () => {
  describe('validateWeights', () => {
    it('should accept valid weights summing to 100%', () => {
      const holdings = [
        { assetId: 'a1', weight: 60 },
        { assetId: 'a2', weight: 40 },
      ];
      const result = validateWeights(holdings);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept weights summing to 100% with many decimal places', () => {
      const holdings = [
        { assetId: 'a1', weight: 33.33 },
        { assetId: 'a2', weight: 33.33 },
        { assetId: 'a3', weight: 33.34 },
      ];
      const result = validateWeights(holdings);
      expect(result.valid).toBe(true);
    });

    it('should reject weights not summing to 100%', () => {
      const holdings = [
        { assetId: 'a1', weight: 50 },
        { assetId: 'a2', weight: 40 },
      ];
      const result = validateWeights(holdings);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('must sum to 100%');
    });

    it('should reject empty holdings', () => {
      const holdings: { assetId: string; weight: number }[] = [];
      const result = validateWeights(holdings);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('at least one holding');
    });

    it('should reject duplicate assets', () => {
      const holdings = [
        { assetId: 'a1', weight: 60 },
        { assetId: 'a1', weight: 40 },
      ];
      const result = validateWeights(holdings);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Duplicate');
    });

    it('should warn about zero weight holdings', () => {
      const holdings = [
        { assetId: 'a1', weight: 100 },
        { assetId: 'a2', weight: 0 },
      ];
      const result = validateWeights(holdings);
      expect(result.valid).toBe(true);
      expect(result.warnings[0]).toContain('0% weight');
    });
  });

  describe('normalizeWeights', () => {
    it('should normalize weights to 100%', () => {
      const holdings = [
        { assetId: 'a1', weight: 25 },
        { assetId: 'a2', weight: 75 },
      ];
      const normalized = normalizeWeights(holdings);
      const total = normalized.reduce((sum, h) => sum + h.weight, 0);
      expect(total).toBe(100);
    });

    it('should preserve relative ratios', () => {
      const holdings = [
        { assetId: 'a1', weight: 1 },
        { assetId: 'a2', weight: 3 },
      ];
      const normalized = normalizeWeights(holdings);
      expect(normalized[0].weight).toBe(25);
      expect(normalized[1].weight).toBe(75);
    });

    it('should handle zero total', () => {
      const holdings = [
        { assetId: 'a1', weight: 0 },
        { assetId: 'a2', weight: 0 },
      ];
      const normalized = normalizeWeights(holdings);
      expect(normalized).toEqual(holdings);
    });
  });

  describe('parseWeightInput', () => {
    it('should parse simple numbers', () => {
      expect(parseWeightInput('50')).toBe(50);
    });

    it('should parse decimal numbers', () => {
      expect(parseWeightInput('33.33')).toBe(33.33);
    });

    it('should parse comma decimals', () => {
      expect(parseWeightInput('33,33')).toBe(33.33);
    });

    it('should parse percentage strings', () => {
      expect(parseWeightInput('50%')).toBe(50);
    });

    it('should return null for invalid input', () => {
      expect(parseWeightInput('abc')).toBeNull();
    });
  });
});

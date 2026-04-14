import { describe, it, expect } from 'vitest';
import { parseCSV, groupRowsBySymbol, getDateRange } from '../lib/csv/parser';

describe('CSV Parser', () => {
  describe('parseCSV', () => {
    it('should parse valid CSV with required columns', () => {
      const csv = `date,symbol,close
2024-01-01,AAPL,185.50
2024-01-02,AAPL,186.75
2024-01-03,AAPL,184.25`;
      
      const result = parseCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalRows).toBe(3);
      expect(result.stats.validRows).toBe(3);
    });

    it('should reject CSV missing required columns', () => {
      const csv = `date,symbol
2024-01-01,AAPL`;
      
      const result = parseCSV(csv);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Missing required columns');
    });

    it('should reject invalid date format', () => {
      const csv = `date,symbol,close
invalid-date,AAPL,185.50`;
      
      const result = parseCSV(csv);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.column === 'date')).toBe(true);
    });

    it('should reject empty symbol', () => {
      const csv = `date,symbol,close
2024-01-01,,185.50`;
      
      const result = parseCSV(csv);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.column === 'symbol')).toBe(true);
    });

    it('should reject non-positive close price', () => {
      const csv = `date,symbol,close
2024-01-01,AAPL,0
2024-01-02,AAPL,-10`;
      
      const result = parseCSV(csv);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.column === 'close')).toBe(true);
    });

    it('should parse optional columns when present', () => {
      const csv = `date,symbol,close,open,high,low,volume
2024-01-01,AAPL,185.50,185.00,186.00,184.50,1000000`;
      
      const result = parseCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.rows[0]).toMatchObject({
        open: 185,
        high: 186,
        low: 184.5,
        volume: 1000000,
      });
    });

    it('should handle duplicate rows (keeping first)', () => {
      const csv = `date,symbol,close
2024-01-01,AAPL,185.50
2024-01-01,AAPL,185.50`;
      
      const result = parseCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.rows).toHaveLength(2);
    });

    it('should handle empty CSV', () => {
      const csv = ``;
      
      const result = parseCSV(csv);
      
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('must have a header row');
    });

    it('should normalize symbol to uppercase', () => {
      const csv = `date,symbol,close
2024-01-01,aapl,185.50`;
      
      const result = parseCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.rows[0].symbol).toBe('AAPL');
    });
  });

  describe('groupRowsBySymbol', () => {
    it('should group rows by symbol', () => {
      const csv = `date,symbol,close
2024-01-01,AAPL,185.50
2024-01-01,MSFT,380.00
2024-01-02,AAPL,186.00`;
      
      const result = parseCSV(csv);
      const grouped = groupRowsBySymbol(result.rows);
      
      expect(grouped.get('AAPL')).toHaveLength(2);
      expect(grouped.get('MSFT')).toHaveLength(1);
    });
  });

  describe('getDateRange', () => {
    it('should return correct date range', () => {
      const csv = `date,symbol,close
2024-01-01,AAPL,185.50
2024-01-05,AAPL,186.00
2024-01-03,AAPL,184.00`;
      
      const result = parseCSV(csv);
      const range = getDateRange(result.rows);
      
      expect(range).toEqual({ start: '2024-01-01', end: '2024-01-05' });
    });

    it('should return null for empty rows', () => {
      const range = getDateRange([]);
      expect(range).toBeNull();
    });
  });
});

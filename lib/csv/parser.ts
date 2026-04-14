import { z } from 'zod';

export const PriceRowSchema = z.object({
  date: z.string(),
  symbol: z.string().min(1, 'Symbol cannot be empty'),
  close: z.number().positive('Close price must be positive'),
  open: z.number().positive('Open price must be positive').optional(),
  high: z.number().positive('High price must be positive').optional(),
  low: z.number().positive('Low price must be positive').optional(),
  volume: z.number().nonnegative('Volume cannot be negative').optional(),
});

export type PriceRow = z.infer<typeof PriceRowSchema>;

export interface ParseResult {
  success: boolean;
  rows: PriceRow[];
  errors: ParseError[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

export interface ParseError {
  row: number;
  column?: string;
  message: string;
  value?: unknown;
}

const REQUIRED_COLUMNS = ['date', 'symbol', 'close'];
const OPTIONAL_COLUMNS = ['open', 'high', 'low', 'volume'];
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function parseNumber(value: string): number | null {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  return num;
}

export function parseCSV(csvContent: string): ParseResult {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    return {
      success: false,
      rows: [],
      errors: [{ row: 0, message: 'CSV must have a header row and at least one data row' }],
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  
  const missingRequired = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missingRequired.length > 0) {
    return {
      success: false,
      rows: [],
      errors: [{ row: 0, message: `Missing required columns: ${missingRequired.join(', ')}` }],
      stats: { totalRows: 0, validRows: 0, invalidRows: 0 },
    };
  }

  const columnIndexMap: Record<string, number> = {};
  for (const col of ALL_COLUMNS) {
    const index = headers.indexOf(col);
    if (index !== -1) {
      columnIndexMap[col] = index;
    }
  }

  const rows: PriceRow[] = [];
  const errors: ParseError[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    
    const rowNum = i + 1;
    const rowData: Record<string, unknown> = {};
    
    const dateValue = values[columnIndexMap['date']];
    const date = parseDate(dateValue);
    if (!date) {
      errors.push({ row: rowNum, column: 'date', message: 'Invalid date format', value: dateValue });
      continue;
    }
    rowData.date = date.toISOString().split('T')[0];
    
    const symbolValue = values[columnIndexMap['symbol']];
    if (!symbolValue || symbolValue.length === 0) {
      errors.push({ row: rowNum, column: 'symbol', message: 'Symbol cannot be empty', value: symbolValue });
      continue;
    }
    rowData.symbol = symbolValue.toUpperCase();
    
    const closeValue = values[columnIndexMap['close']];
    const close = parseNumber(closeValue);
    if (close === null || close <= 0) {
      errors.push({ row: rowNum, column: 'close', message: 'Close price must be a positive number', value: closeValue });
      continue;
    }
    rowData.close = close;
    
    if (columnIndexMap['open'] !== undefined) {
      const openValue = values[columnIndexMap['open']];
      if (openValue && openValue.length > 0) {
        const open = parseNumber(openValue);
        if (open !== null && open > 0) {
          rowData.open = open;
        }
      }
    }
    
    if (columnIndexMap['high'] !== undefined) {
      const highValue = values[columnIndexMap['high']];
      if (highValue && highValue.length > 0) {
        const high = parseNumber(highValue);
        if (high !== null && high > 0) {
          rowData.high = high;
        }
      }
    }
    
    if (columnIndexMap['low'] !== undefined) {
      const lowValue = values[columnIndexMap['low']];
      if (lowValue && lowValue.length > 0) {
        const low = parseNumber(lowValue);
        if (low !== null && low > 0) {
          rowData.low = low;
        }
      }
    }
    
    if (columnIndexMap['volume'] !== undefined) {
      const volumeValue = values[columnIndexMap['volume']];
      if (volumeValue && volumeValue.length > 0) {
        const volume = parseNumber(volumeValue);
        if (volume !== null && volume >= 0) {
          rowData.volume = volume;
        }
      }
    }

    const validation = PriceRowSchema.safeParse(rowData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      errors.push({
        row: rowNum,
        column: firstError.path.join('.'),
        message: firstError.message,
        value: rowData,
      });
      continue;
    }

    rows.push(validation.data);
  }

  return {
    success: errors.length === 0,
    rows,
    errors,
    stats: {
      totalRows: lines.length - 1,
      validRows: rows.length,
      invalidRows: errors.filter(e => e.row > 0).length,
    },
  };
}

export function groupRowsBySymbol(rows: PriceRow[]): Map<string, PriceRow[]> {
  const grouped = new Map<string, PriceRow[]>();
  for (const row of rows) {
    const existing = grouped.get(row.symbol) || [];
    existing.push(row);
    grouped.set(row.symbol, existing);
  }
  return grouped;
}

export function getDateRange(rows: PriceRow[]): { start: string; end: string } | null {
  if (rows.length === 0) return null;
  
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  return {
    start: sorted[0].date,
    end: sorted[sorted.length - 1].date,
  };
}

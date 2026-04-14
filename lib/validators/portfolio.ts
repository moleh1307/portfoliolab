import { z } from 'zod';

export const PortfolioHoldingSchema = z.object({
  assetId: z.string().min(1, 'Asset is required'),
  weight: z.number().min(0).max(100),
});

export const CreatePortfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required').max(100),
  description: z.string().max(500).optional(),
  holdings: z
    .array(PortfolioHoldingSchema)
    .min(1, 'Portfolio must have at least one holding'),
});

export type PortfolioHoldingInput = z.infer<typeof PortfolioHoldingSchema>;
export type CreatePortfolioInput = z.infer<typeof CreatePortfolioSchema>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const WEIGHT_TOLERANCE = 0.01;

export function validateWeights(holdings: PortfolioHoldingInput[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (holdings.length === 0) {
    errors.push('Portfolio must have at least one holding');
    return { valid: false, errors, warnings };
  }

  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
  const normalizedTotal = Math.round(totalWeight * 100) / 100;

  if (Math.abs(normalizedTotal - 100) > WEIGHT_TOLERANCE * 100) {
    errors.push(
      `Weights must sum to 100%. Current sum: ${normalizedTotal.toFixed(2)}%`
    );
  }

  const assetIds = holdings.map((h) => h.assetId);
  const duplicates = assetIds.filter(
    (id, index) => assetIds.indexOf(id) !== index
  );
  if (duplicates.length > 0) {
    errors.push(`Duplicate assets found: ${Array.from(new Set(duplicates)).join(', ')}`);
  }

  const zeroWeightAssets = holdings.filter((h) => h.weight === 0);
  if (zeroWeightAssets.length > 0) {
    warnings.push(`${zeroWeightAssets.length} holding(s) have 0% weight`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function normalizeWeights(
  holdings: PortfolioHoldingInput[]
): PortfolioHoldingInput[] {
  const total = holdings.reduce((sum, h) => sum + h.weight, 0);
  if (total === 0) return holdings;

  const factor = 100 / total;
  return holdings.map((h) => ({
    ...h,
    weight: Math.round(h.weight * factor * 100) / 100,
  }));
}

export function parseWeightInput(value: string): number | null {
  const cleaned = value.replace('%', '').trim().replace(',', '.');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return num;
}

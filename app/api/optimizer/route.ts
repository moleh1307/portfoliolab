import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { optimizePortfolio, type PriceData } from '@/lib/analytics/engine';

const OptimizeSchema = z.object({
  assetIds: z.array(z.string()).min(2),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

async function ensureLocalUser() {
  const user = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });
  if (!user) {
    await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        email: 'local@localhost',
        password: 'local',
        name: 'Local User',
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    await ensureLocalUser();
    const body = await request.json();
    const validation = OptimizeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 },
      );
    }

    const { assetIds, startDate, endDate } = validation.data;

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 },
      );
    }

    const priceRecords = await prisma.priceRecord.findMany({
      where: {
        assetId: { in: assetIds },
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });

    const priceMap = new Map<string, PriceData[]>();
    for (const record of priceRecords) {
      const existing = priceMap.get(record.assetId) || [];
      existing.push({
        date: record.date.toISOString().split('T')[0],
        close: record.close,
      });
      priceMap.set(record.assetId, existing);
    }

    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, symbol: true },
    });

    const assetPrices = assets.map((a) => ({
      assetId: a.id,
      symbol: a.symbol,
      prices: priceMap.get(a.id) || [],
    }));

    const optimization = optimizePortfolio(assetPrices, startDate, endDate);

    if (!optimization) {
      return NextResponse.json(
        { error: 'Insufficient data for optimization' },
        { status: 400 },
      );
    }

    return NextResponse.json({ optimization });
  } catch (error) {
    console.error('Error running optimization:', error);
    return NextResponse.json(
      { error: 'Failed to run optimization' },
      { status: 500 },
    );
  }
}

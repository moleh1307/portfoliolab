import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { computeCorrelationMatrix, type PriceData } from '@/lib/analytics/engine';

async function ensureLocalUser() {
  const existing = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });
  if (!existing) {
    await prisma.user.create({
      data: { id: DEFAULT_USER_ID, email: 'local@portfoliolab.local', name: 'Local User', password: 'local' },
    });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await ensureLocalUser();

    const backtest = await prisma.backtestRun.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      include: {
        portfolio: {
          include: {
            holdings: {
              include: {
                asset: {
                  select: {
                    id: true,
                    symbol: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
        benchmark: {
          select: {
            id: true,
            symbol: true,
            displayName: true,
          },
        },
        dataPoints: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!backtest) {
      return NextResponse.json({ error: 'Backtest not found' }, { status: 404 });
    }

    const assetIds = backtest.portfolio.holdings.map((h) => h.assetId);
    const priceRecords = await prisma.priceRecord.findMany({
      where: {
        assetId: { in: assetIds },
        date: {
          gte: backtest.startDate,
          lte: backtest.endDate,
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

    const assetPrices = backtest.portfolio.holdings.map((h) => ({
      assetId: h.assetId,
      symbol: h.asset.symbol,
      prices: priceMap.get(h.assetId) || [],
    }));

    const correlationMatrix = computeCorrelationMatrix(
      assetPrices,
      backtest.startDate.toISOString().split('T')[0],
      backtest.endDate.toISOString().split('T')[0]
    );

    return NextResponse.json({ backtest, correlationMatrix });
  } catch (error) {
    console.error('Error fetching backtest:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backtest' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await ensureLocalUser();

    const backtest = await prisma.backtestRun.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (!backtest) {
      return NextResponse.json({ error: 'Backtest not found' }, { status: 404 });
    }

    await prisma.backtestPoint.deleteMany({
      where: { backtestRunId: id },
    });

    await prisma.backtestRun.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting backtest:', error);
    return NextResponse.json(
      { error: 'Failed to delete backtest' },
      { status: 500 },
    );
  }
}

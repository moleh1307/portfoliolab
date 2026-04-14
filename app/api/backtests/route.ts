import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { runBacktest, type PriceData } from '@/lib/analytics/engine';

const CreateBacktestSchema = z.object({
  portfolioId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  rebalanceFrequency: z.enum(['none', 'monthly', 'quarterly']),
  initialCapital: z.number().positive(),
  benchmarkAssetId: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backtests = await prisma.backtestRun.findMany({
      where: { userId: session.user.id },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ backtests });
  } catch (error) {
    console.error('Error fetching backtests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backtests' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = CreateBacktestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 },
      );
    }

    const { portfolioId, startDate, endDate, rebalanceFrequency, initialCapital, benchmarkAssetId } = validation.data;

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 },
      );
    }

    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId: session.user.id,
      },
      include: {
        holdings: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 },
      );
    }

    if (portfolio.holdings.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio has no holdings' },
        { status: 400 },
      );
    }

    const assetIds = portfolio.holdings.map((h) => h.assetId);
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

    const assetPrices = portfolio.holdings.map((h) => ({
      assetId: h.assetId,
      symbol: h.asset.symbol,
      prices: priceMap.get(h.assetId) || [],
    }));

    const config = {
      holdings: portfolio.holdings.map((h) => ({
        assetId: h.assetId,
        weight: h.weight / 100,
      })),
      startDate,
      endDate,
      initialCapital,
      rebalanceFrequency: rebalanceFrequency as 'none' | 'monthly' | 'quarterly',
    };

    const result = runBacktest(assetPrices, config);

    const backtestRun = await prisma.backtestRun.create({
      data: {
        userId: session.user.id,
        portfolioId,
        benchmarkAssetId: benchmarkAssetId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rebalanceFrequency,
        initialCapital,
        status: 'completed',
        summaryMetrics: JSON.stringify(result.summary),
      },
    });

    await prisma.backtestPoint.createMany({
      data: result.dataPoints.map((dp) => ({
        backtestRunId: backtestRun.id,
        date: new Date(dp.date),
        portfolioValue: dp.value,
        portfolioReturn: dp.dailyReturn,
        drawdown: dp.drawdown,
      })),
    });

    const backtestWithPoints = await prisma.backtestRun.findUnique({
      where: { id: backtestRun.id },
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
          },
        },
        dataPoints: {
          orderBy: { date: 'asc' },
        },
      },
    });

    return NextResponse.json({ backtest: backtestWithPoints }, { status: 201 });
  } catch (error) {
    console.error('Error running backtest:', error);
    return NextResponse.json(
      { error: 'Failed to run backtest' },
      { status: 500 },
    );
  }
}

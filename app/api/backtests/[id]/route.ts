import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_USER_ID } from '@/lib/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        dataPoints: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!backtest) {
      return NextResponse.json({ error: 'Backtest not found' }, { status: 404 });
    }

    return NextResponse.json({ backtest });
  } catch (error) {
    console.error('Error fetching backtest:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backtest' },
      { status: 500 },
    );
  }
}

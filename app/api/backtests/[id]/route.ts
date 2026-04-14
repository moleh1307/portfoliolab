import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backtest = await prisma.backtestRun.findFirst({
      where: {
        id,
        userId: session.user.id,
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

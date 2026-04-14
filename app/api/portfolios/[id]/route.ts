import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { CreatePortfolioSchema, validateWeights } from '@/lib/validators/portfolio';

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

    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        holdings: {
          include: {
            asset: {
              select: {
                id: true,
                symbol: true,
                displayName: true,
                datasetId: true,
                firstDate: true,
                lastDate: true,
              },
            },
          },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.portfolio.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = CreatePortfolioSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 },
      );
    }

    const { name, description, holdings } = validation.data;

    const weightValidation = validateWeights(holdings);
    if (!weightValidation.valid) {
      return NextResponse.json(
        { error: weightValidation.errors[0] },
        { status: 400 },
      );
    }

    const userAssetIds = holdings.map((h) => h.assetId);
    const userAssets = await prisma.asset.findMany({
      where: {
        id: { in: userAssetIds },
        userId: session.user.id,
      },
      select: { id: true },
    });

    const validAssetIds = new Set(userAssets.map((a) => a.id));
    const invalidAssets = holdings.filter((h) => !validAssetIds.has(h.assetId));

    if (invalidAssets.length > 0) {
      return NextResponse.json(
        { error: 'One or more assets do not belong to you' },
        { status: 400 },
      );
    }

    await prisma.portfolioHolding.deleteMany({
      where: { portfolioId: id },
    });

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: {
        name,
        description,
        holdings: {
          create: holdings.map((h) => ({
            assetId: h.assetId,
            weight: h.weight,
          })),
        },
      },
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
    });

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to update portfolio' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    await prisma.portfolio.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to delete portfolio' },
      { status: 500 },
    );
  }
}

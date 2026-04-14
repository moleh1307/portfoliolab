import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_USER_ID } from '@/lib/constants';
import { CreatePortfolioSchema, validateWeights } from '@/lib/validators/portfolio';

export async function GET() {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: {
        holdings: {
          include: {
            asset: {
              select: {
                id: true,
                symbol: true,
                displayName: true,
                datasetId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolios' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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
        userId: DEFAULT_USER_ID,
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

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: DEFAULT_USER_ID,
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

    return NextResponse.json({ portfolio }, { status: 201 });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to create portfolio' },
      { status: 500 },
    );
  }
}

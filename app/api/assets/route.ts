import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_USER_ID } from '@/lib/constants';

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      where: { userId: DEFAULT_USER_ID },
      select: {
        id: true,
        symbol: true,
        displayName: true,
        datasetId: true,
        firstDate: true,
        lastDate: true,
        dataset: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ symbol: 'asc' }],
    });

    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 },
    );
  }
}

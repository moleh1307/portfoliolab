import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_USER_ID } from '@/lib/constants';

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

export async function GET() {
  try {
    await ensureLocalUser();
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

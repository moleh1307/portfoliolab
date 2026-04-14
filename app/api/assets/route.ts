import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assets = await prisma.asset.findMany({
      where: { userId: session.user.id },
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

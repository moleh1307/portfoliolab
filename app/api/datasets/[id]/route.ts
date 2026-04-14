import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_USER_ID } from '@/lib/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dataset = await prisma.dataset.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
      include: {
        assets: {
          include: {
            priceRecords: {
              select: {
                id: true,
                date: true,
                close: true,
              },
              orderBy: { date: 'asc' },
              take: 5,
            },
          },
        },
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    return NextResponse.json({ dataset });
  } catch (error) {
    console.error('Error fetching dataset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
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

    const dataset = await prisma.dataset.findFirst({
      where: {
        id,
        userId: DEFAULT_USER_ID,
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    await prisma.dataset.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    return NextResponse.json(
      { error: 'Failed to delete dataset' },
      { status: 500 },
    );
  }
}

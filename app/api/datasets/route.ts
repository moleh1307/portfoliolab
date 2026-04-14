import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { DEFAULT_USER_ID } from '@/lib/constants';

const createDatasetSchema = z.object({
  name: z.string().min(1, 'Dataset name is required'),
  fileName: z.string().min(1, 'File name is required'),
});

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
    const datasets = await prisma.dataset.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: {
        assets: {
          select: {
            id: true,
            symbol: true,
            displayName: true,
            firstDate: true,
            lastDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ datasets });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureLocalUser();
    const body = await request.json();
    const validation = createDatasetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 },
      );
    }

    const { name, fileName } = validation.data;

    const dataset = await prisma.dataset.create({
      data: {
        userId: DEFAULT_USER_ID,
        name,
        fileName,
        status: 'pending',
      },
    });

    return NextResponse.json({ dataset }, { status: 201 });
  } catch (error) {
    console.error('Error creating dataset:', error);
    return NextResponse.json(
      { error: 'Failed to create dataset' },
      { status: 500 },
    );
  }
}

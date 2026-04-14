import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { parseCSV, groupRowsBySymbol, getDateRange } from '@/lib/csv/parser';

const importDatasetSchema = z.object({
  datasetId: z.string().min(1),
  csvContent: z.string().min(1, 'CSV content is required'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = importDatasetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 },
      );
    }

    const { datasetId, csvContent } = validation.data;

    const dataset = await prisma.dataset.findFirst({
      where: {
        id: datasetId,
        userId: session.user.id,
      },
    });

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 },
      );
    }

    const parseResult = parseCSV(csvContent);

    if (!parseResult.success && parseResult.rows.length === 0) {
      return NextResponse.json(
        { 
          error: 'CSV parsing failed',
          details: parseResult.errors.slice(0, 5),
        },
        { status: 400 },
      );
    }

    const groupedRows = groupRowsBySymbol(parseResult.rows);
    const symbols = Array.from(groupedRows.keys());
    
    const existingAssets = await prisma.asset.findMany({
      where: {
        userId: session.user.id,
        symbol: { in: symbols },
      },
    });
    
    const existingSymbols = new Set(existingAssets.map(a => a.symbol));

    const newAssetsData = symbols
      .filter(s => !existingSymbols.has(s))
      .map(symbol => {
        const rows = groupedRows.get(symbol)!;
        const dateRange = getDateRange(rows);
        return {
          userId: session.user.id,
          datasetId,
          symbol,
          displayName: symbol,
          firstDate: dateRange?.start ? new Date(dateRange.start) : null,
          lastDate: dateRange?.end ? new Date(dateRange.end) : null,
        };
      });

    const createdAssets = newAssetsData.length > 0
      ? await prisma.asset.createMany({ data: newAssetsData })
      : { count: 0 };

    const allAssets = await prisma.asset.findMany({
      where: {
        userId: session.user.id,
        symbol: { in: symbols },
      },
    });

    const assetMap = new Map(allAssets.map(a => [a.symbol, a]));

    const priceRecordsData: {
      assetId: string;
      date: Date;
      close: number;
      open?: number;
      high?: number;
      low?: number;
      volume?: number;
    }[] = [];

    for (const [symbol, rows] of Array.from(groupedRows.entries())) {
      const asset = assetMap.get(symbol);
      if (!asset) continue;

      for (const row of rows) {
        priceRecordsData.push({
          assetId: asset.id,
          date: new Date(row.date),
          close: row.close,
          open: row.open,
          high: row.high,
          low: row.low,
          volume: row.volume,
        });
      }
    }

    let createdPriceRecords = { count: 0 };
    if (priceRecordsData.length > 0) {
      const result = await prisma.priceRecord.createMany({
        data: priceRecordsData,
      });
      createdPriceRecords = { count: result.count };
    }

    const importSummary = JSON.stringify({
      symbolsImported: symbols.length,
      rowsImported: parseResult.rows.length,
      errorsCount: parseResult.errors.length,
      errors: parseResult.errors.slice(0, 10),
    });

    const updatedDataset = await prisma.dataset.update({
      where: { id: datasetId },
      data: {
        status: parseResult.errors.length > 0 ? 'partial' : 'completed',
        importSummary,
      },
    });

    return NextResponse.json({
      dataset: updatedDataset,
      importResult: {
        success: parseResult.success,
        stats: parseResult.stats,
        symbolsImported: symbols.length,
        assetsCreated: newAssetsData.length,
        priceRecordsCreated: createdPriceRecords.count,
        errors: parseResult.errors.slice(0, 20),
      },
    });
  } catch (error) {
    console.error('Error importing dataset:', error);
    return NextResponse.json(
      { error: 'Failed to import dataset' },
      { status: 500 },
    );
  }
}

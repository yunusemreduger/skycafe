import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, StockItem } from '@/lib/db';

export async function GET() {
  const db = readDB();
  return NextResponse.json(db.stockItems);
}

export async function POST(req: NextRequest) {
  const db = readDB();
  const body = await req.json();
  const item: StockItem = {
    id: generateId(),
    name: body.name,
    unit: body.unit,
    quantity: Number(body.quantity),
    minQuantity: Number(body.minQuantity),
    costPerUnit: Number(body.costPerUnit || 0),
    lastUpdated: new Date().toISOString(),
  };
  db.stockItems.push(item);
  writeDB(db);
  return NextResponse.json(item, { status: 201 });
}

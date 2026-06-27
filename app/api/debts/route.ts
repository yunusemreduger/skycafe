import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';

export async function GET() {
  const db = readDB();
  return NextResponse.json((db.debts ?? []).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
}

export async function POST(req: NextRequest) {
  const db = readDB();
  const body = await req.json();
  const debt = {
    id: generateId(),
    tableNumber: body.tableNumber,
    customerName: body.customerName,
    amount: body.amount,
    description: body.description,
    orderId: body.orderId,
    status: 'unpaid' as const,
    createdAt: new Date().toISOString(),
  };
  if (!db.debts) db.debts = [];
  db.debts.push(debt);
  writeDB(db);
  return NextResponse.json(debt, { status: 201 });
}

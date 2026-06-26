import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, FinanceRecord } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = readDB();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // format: 2024-01
  let records = db.financeRecords;
  if (month) records = records.filter(r => r.date.startsWith(month));
  return NextResponse.json(records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
}

export async function POST(req: NextRequest) {
  const db = readDB();
  const body = await req.json();
  const record: FinanceRecord = {
    id: generateId(),
    type: body.type,
    category: body.category,
    amount: Number(body.amount),
    description: body.description || '',
    date: body.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
  db.financeRecords.push(record);
  writeDB(db);
  return NextResponse.json(record, { status: 201 });
}

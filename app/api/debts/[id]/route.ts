import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDB();
  if (!db.debts) db.debts = [];
  const idx = db.debts.findIndex(d => d.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const prev = db.debts[idx];
  db.debts[idx] = { ...prev, ...body };

  // Borç ödendi → finansa gelir olarak ekle
  if (body.status === 'paid' && prev.status !== 'paid') {
    db.debts[idx].paidAt = new Date().toISOString();
    db.financeRecords.push({
      id: generateId(),
      type: 'income',
      category: 'Borç Tahsilat',
      amount: prev.amount,
      description: `Daire ${prev.tableNumber}${prev.customerName ? ' — ' + prev.customerName : ''} borç ödemesi`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });
  }

  await writeDB(db);
  return NextResponse.json(db.debts[idx]);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDB();
  if (!db.debts) db.debts = [];
  db.debts = db.debts.filter(d => d.id !== id);
  await writeDB(db);
  return NextResponse.json({ success: true });
}

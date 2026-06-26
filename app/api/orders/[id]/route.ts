import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDB();
  const body = await req.json();
  const idx = db.orders.findIndex(o => o.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const prev = db.orders[idx];
  db.orders[idx] = { ...prev, ...body, updatedAt: new Date().toISOString() };

  // Ödeme alındığında finans kaydı oluştur
  if (body.paymentStatus === 'paid' && prev.paymentStatus !== 'paid') {
    const order = db.orders[idx];
    db.financeRecords.push({
      id: generateId(),
      type: 'income',
      category: 'Satış',
      amount: order.total,
      description: `Daire ${order.tableNumber} — ${order.paymentMethod === 'card' ? 'Kartla' : 'Nakit'} ödeme`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });
  }

  writeDB(db);
  return NextResponse.json(db.orders[idx]);
}

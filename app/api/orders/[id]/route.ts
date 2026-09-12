import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';
import { deductStockForItems } from '@/lib/stock';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDB();
  const body = await req.json();
  const idx = db.orders.findIndex(o => o.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const prev = db.orders[idx];
  db.orders[idx] = { ...prev, ...body, updatedAt: new Date().toISOString() };

  let stockWarnings: string[] = [];

  // ---- Sipariş "Tamamlandı" olduğunda reçetelere göre stok düş ----
  const justCompleted = body.status === 'completed' && prev.status !== 'completed';
  if (justCompleted && !prev.stockDeducted) {
    stockWarnings = deductStockForItems(db, db.orders[idx].items);
    db.orders[idx].stockDeducted = true;
  }

  // ---- Ödeme alındığında finans kaydı oluştur ----
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

  await writeDB(db);
  return NextResponse.json({ ...db.orders[idx], stockWarnings });
}

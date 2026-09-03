import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, Order } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = await readDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const since = searchParams.get('since');

  let orders = db.orders;
  if (status) orders = orders.filter(o => o.status === status);
  if (since) orders = orders.filter(o => new Date(o.createdAt) > new Date(since));

  return NextResponse.json(orders.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ));
}

export async function POST(req: NextRequest) {
  const db = await readDB();
  const body = await req.json();

  const total = body.items.reduce((sum: number, item: { price: number; quantity: number }) =>
    sum + item.price * item.quantity, 0);

  const order: Order = {
    id: generateId(),
    tableNumber: body.tableNumber,
    customerName: body.customerName,
    items: body.items,
    total,
    status: 'pending',
    paymentMethod: body.paymentMethod || 'cash',
    paymentStatus: 'unpaid',
    note: body.note,
    stockDeducted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.orders.push(order);

  // Not: Stok düşümü sipariş "Tamamlandı" olduğunda yapılır (bkz. /api/orders/[id])

  await writeDB(db);
  return NextResponse.json(order, { status: 201 });
}

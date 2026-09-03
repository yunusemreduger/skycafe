import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDB();
  const body = await req.json();
  const idx = db.orders.findIndex(o => o.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const prev = db.orders[idx];
  db.orders[idx] = { ...prev, ...body, updatedAt: new Date().toISOString() };

  const stockWarnings: string[] = [];

  // ---- Sipariş "Tamamlandı" olduğunda reçetelere göre stok düş ----
  const justCompleted = body.status === 'completed' && prev.status !== 'completed';
  if (justCompleted && !prev.stockDeducted) {
    const order = db.orders[idx];

    for (const item of order.items) {
      const menuItem = db.menuItems.find(m => m.id === item.menuItemId);
      if (!menuItem) continue;

      // Yeni reçete formatı; yoksa eski tekli stok bağlantısına düş
      const recipe = menuItem.recipe?.length
        ? menuItem.recipe
        : menuItem.stockItemId
          ? [{ stockItemId: menuItem.stockItemId, amount: menuItem.stockDeductAmount ?? 1 }]
          : [];

      for (const line of recipe) {
        const sIdx = db.stockItems.findIndex(s => s.id === line.stockItemId);
        if (sIdx === -1) continue;

        const stok = db.stockItems[sIdx];
        const gerekli = line.amount * item.quantity;
        if (stok.quantity < gerekli) {
          stockWarnings.push(`${stok.name}: ${gerekli} ${stok.unit} gerekiyordu, stokta ${stok.quantity} ${stok.unit} vardı`);
        }
        stok.quantity = Math.max(0, stok.quantity - gerekli);
        stok.lastUpdated = new Date().toISOString();
      }
    }

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

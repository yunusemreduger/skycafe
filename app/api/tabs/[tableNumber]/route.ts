import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, TABLE_NUMBERS, Order } from '@/lib/db';
import { deductStockForItems, calcTotal } from '@/lib/stock';

function openTabOf(db: Awaited<ReturnType<typeof readDB>>, tableNo: number) {
  return (db.tabs ?? []).find(t => t.tableNumber === tableNo && t.status === 'open');
}

/**
 * Adisyon işlemleri. body.action ile belirlenir:
 *  - setQuantity : { menuItemId, note?, quantity }  adet değiştir (0 = satırı sil)
 *  - move        : { targetTable }                  adisyonu başka masaya taşı
 *  - merge       : { targetTable }                  bu masayı hedef masayla birleştir
 *  - close       : { paymentMethod: 'cash'|'card' } hesabı kapat, tahsil et
 *  - toDebt      : { customerName }                 hesabı borç defterine yaz
 *  - cancel      : adisyonu iptal et (stok düşmez, kayıt oluşmaz)
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ tableNumber: string }> }) {
  const { tableNumber } = await params;
  const tableNo = Number(tableNumber);
  if (!TABLE_NUMBERS.includes(tableNo)) {
    return NextResponse.json({ error: 'Geçersiz masa numarası' }, { status: 400 });
  }

  const db = await readDB();
  const body = await req.json();
  const tab = openTabOf(db, tableNo);
  if (!tab) return NextResponse.json({ error: 'Bu masada açık adisyon yok' }, { status: 404 });

  const now = new Date().toISOString();

  switch (body.action) {
    // ---------------------------------------------------------------
    case 'setQuantity': {
      const { menuItemId, note, quantity } = body;
      const idx = tab.items.findIndex(i => i.menuItemId === menuItemId && (i.note ?? '') === (note ?? ''));
      if (idx === -1) return NextResponse.json({ error: 'Ürün adisyonda yok' }, { status: 404 });

      if (Number(quantity) <= 0) tab.items.splice(idx, 1);
      else tab.items[idx].quantity = Number(quantity);

      // Adisyon boşaldıysa kapat
      if (tab.items.length === 0) {
        tab.status = 'closed';
        tab.closedAt = now;
      }
      tab.updatedAt = now;
      break;
    }

    // ---------------------------------------------------------------
    case 'move': {
      const hedef = Number(body.targetTable);
      if (!TABLE_NUMBERS.includes(hedef) || hedef === tableNo) {
        return NextResponse.json({ error: 'Geçersiz hedef masa' }, { status: 400 });
      }
      if (openTabOf(db, hedef)) {
        return NextResponse.json({ error: `Masa ${hedef} dolu — taşımak yerine birleştirin` }, { status: 409 });
      }
      tab.tableNumber = hedef;
      tab.updatedAt = now;
      break;
    }

    // ---------------------------------------------------------------
    case 'merge': {
      const hedef = Number(body.targetTable);
      if (!TABLE_NUMBERS.includes(hedef) || hedef === tableNo) {
        return NextResponse.json({ error: 'Geçersiz hedef masa' }, { status: 400 });
      }
      const hedefTab = openTabOf(db, hedef);
      if (!hedefTab) {
        return NextResponse.json({ error: `Masa ${hedef} boş — birleştirmek yerine taşıyın` }, { status: 409 });
      }

      // Bu masanın ürünlerini hedefe aktar
      for (const item of tab.items) {
        const mevcut = hedefTab.items.find(
          i => i.menuItemId === item.menuItemId && (i.note ?? '') === (item.note ?? '')
        );
        if (mevcut) mevcut.quantity += item.quantity;
        else hedefTab.items.push({ ...item });
      }
      hedefTab.updatedAt = now;

      tab.items = [];
      tab.status = 'closed';
      tab.closedAt = now;
      tab.updatedAt = now;
      break;
    }

    // ---------------------------------------------------------------
    case 'close': {
      if (tab.items.length === 0) {
        return NextResponse.json({ error: 'Adisyon boş' }, { status: 400 });
      }
      const paymentMethod: 'cash' | 'card' = body.paymentMethod === 'card' ? 'card' : 'cash';
      const total = calcTotal(tab.items);

      const order: Order = {
        id: generateId(),
        tableNumber: `Masa ${tab.tableNumber}`,
        customerName: body.customerName || undefined,
        items: [...tab.items],
        total,
        status: 'completed',
        paymentMethod,
        paymentStatus: 'paid',
        note: tab.note,
        stockDeducted: true,
        createdAt: tab.openedAt,
        updatedAt: now,
      };
      db.orders.push(order);

      const warnings = deductStockForItems(db, tab.items);

      db.financeRecords.push({
        id: generateId(),
        type: 'income',
        category: 'Satış',
        amount: total,
        description: `Masa ${tab.tableNumber} — ${paymentMethod === 'card' ? 'Kartla' : 'Nakit'} ödeme`,
        date: now.split('T')[0],
        createdAt: now,
      });

      tab.status = 'closed';
      tab.closedAt = now;
      tab.orderId = order.id;
      tab.updatedAt = now;

      await writeDB(db);
      return NextResponse.json({ success: true, order, stockWarnings: warnings });
    }

    // ---------------------------------------------------------------
    case 'toDebt': {
      if (tab.items.length === 0) {
        return NextResponse.json({ error: 'Adisyon boş' }, { status: 400 });
      }
      if (!body.customerName?.trim()) {
        return NextResponse.json({ error: 'Borç için isim gerekli' }, { status: 400 });
      }
      const total = calcTotal(tab.items);

      const order: Order = {
        id: generateId(),
        tableNumber: `Masa ${tab.tableNumber}`,
        customerName: body.customerName.trim(),
        items: [...tab.items],
        total,
        status: 'completed',
        paymentMethod: 'cash',
        paymentStatus: 'unpaid',
        note: tab.note,
        stockDeducted: true,
        createdAt: tab.openedAt,
        updatedAt: now,
      };
      db.orders.push(order);

      const warnings = deductStockForItems(db, tab.items);

      if (!db.debts) db.debts = [];
      db.debts.push({
        id: generateId(),
        tableNumber: `Masa ${tab.tableNumber}`,
        customerName: body.customerName.trim(),
        amount: total,
        description: tab.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
        orderId: order.id,
        status: 'unpaid',
        createdAt: now,
      });

      tab.status = 'closed';
      tab.closedAt = now;
      tab.orderId = order.id;
      tab.updatedAt = now;

      await writeDB(db);
      return NextResponse.json({ success: true, order, stockWarnings: warnings });
    }

    // ---------------------------------------------------------------
    case 'cancel': {
      tab.items = [];
      tab.status = 'closed';
      tab.closedAt = now;
      tab.updatedAt = now;
      break;
    }

    default:
      return NextResponse.json({ error: 'Bilinmeyen işlem' }, { status: 400 });
  }

  await writeDB(db);
  return NextResponse.json({ success: true, tab });
}

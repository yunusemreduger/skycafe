import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, TABLE_NUMBERS, Tab } from '@/lib/db';

/** Tüm masaların güncel durumu — açık adisyonlarla birlikte */
export async function GET() {
  const db = await readDB();
  const openTabs = (db.tabs ?? []).filter(t => t.status === 'open');

  const tables = TABLE_NUMBERS.map(no => {
    const tab = openTabs.find(t => t.tableNumber === no) ?? null;
    return {
      tableNumber: no,
      tab,
      total: tab ? tab.items.reduce((s, i) => s + i.price * i.quantity, 0) : 0,
      itemCount: tab ? tab.items.reduce((s, i) => s + i.quantity, 0) : 0,
    };
  });

  return NextResponse.json({ tables });
}

/** Masaya ürün ekler; masa boşsa adisyonu açar */
export async function POST(req: NextRequest) {
  const db = await readDB();
  const { tableNumber, menuItemId, quantity = 1, note } = await req.json();

  const tableNo = Number(tableNumber);
  if (!TABLE_NUMBERS.includes(tableNo)) {
    return NextResponse.json({ error: 'Geçersiz masa numarası' }, { status: 400 });
  }

  const menuItem = db.menuItems.find(m => m.id === menuItemId);
  if (!menuItem) {
    return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
  }

  if (!db.tabs) db.tabs = [];
  let tab = db.tabs.find(t => t.tableNumber === tableNo && t.status === 'open');

  if (!tab) {
    tab = {
      id: generateId(),
      tableNumber: tableNo,
      items: [],
      status: 'open',
      openedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Tab;
    db.tabs.push(tab);
  }

  // Aynı ürün + aynı not varsa adedini artır, yoksa yeni satır aç
  const existing = tab.items.find(i => i.menuItemId === menuItemId && (i.note ?? '') === (note ?? ''));
  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    tab.items.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: Number(quantity),
      note: note || undefined,
    });
  }

  tab.updatedAt = new Date().toISOString();
  await writeDB(db);
  return NextResponse.json(tab, { status: 201 });
}

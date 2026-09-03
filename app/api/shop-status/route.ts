import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function GET() {
  const db = await readDB();
  const manualOpen = db.shopOpen ?? true;

  // Saat kısıtı yok — dükkanı sadece admin panelindeki AÇIK/KAPALI düğmesi belirler
  return NextResponse.json({
    shopOpen: manualOpen,
    manualOpen,
    withinHours: true,
    openTime: null,
    closeTime: null,
  });
}

export async function PUT(req: NextRequest) {
  const db = await readDB();
  const { shopOpen } = await req.json();
  db.shopOpen = Boolean(shopOpen);
  await writeDB(db);
  return NextResponse.json({ shopOpen: db.shopOpen });
}

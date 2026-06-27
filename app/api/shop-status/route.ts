import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function GET() {
  const db = readDB();
  const manualOpen = db.shopOpen ?? true;

  // Saat kontrolü: 10:00 - 20:00 arası açık (Türkiye saati UTC+3)
  const now = new Date();
  const hour = (now.getUTCHours() + 3) % 24;
  const withinHours = hour >= 10 && hour < 20;

  return NextResponse.json({
    shopOpen: manualOpen && withinHours,
    manualOpen,
    withinHours,
    openTime: '10:00',
    closeTime: '20:00',
  });
}

export async function PUT(req: NextRequest) {
  const db = readDB();
  const { shopOpen } = await req.json();
  db.shopOpen = Boolean(shopOpen);
  writeDB(db);
  return NextResponse.json({ shopOpen: db.shopOpen });
}

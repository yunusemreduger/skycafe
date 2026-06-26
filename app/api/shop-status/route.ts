import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function GET() {
  const db = readDB();
  return NextResponse.json({ shopOpen: db.shopOpen ?? true });
}

export async function PUT(req: NextRequest) {
  const db = readDB();
  const { shopOpen } = await req.json();
  db.shopOpen = Boolean(shopOpen);
  writeDB(db);
  return NextResponse.json({ shopOpen: db.shopOpen });
}

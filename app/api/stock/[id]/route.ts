import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDB();
  const body = await req.json();
  const idx = db.stockItems.findIndex(i => i.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  db.stockItems[idx] = { ...db.stockItems[idx], ...body, lastUpdated: new Date().toISOString() };
  writeDB(db);
  return NextResponse.json(db.stockItems[idx]);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDB();
  db.stockItems = db.stockItems.filter(i => i.id !== id);
  writeDB(db);
  return NextResponse.json({ success: true });
}

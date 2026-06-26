import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDB();
  const body = await req.json();
  const idx = db.menuItems.findIndex(i => i.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  db.menuItems[idx] = { ...db.menuItems[idx], ...body };
  writeDB(db);
  return NextResponse.json(db.menuItems[idx]);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDB();
  db.menuItems = db.menuItems.filter(i => i.id !== id);
  writeDB(db);
  return NextResponse.json({ success: true });
}

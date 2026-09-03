import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDB();
  db.financeRecords = db.financeRecords.filter(r => r.id !== id);
  await writeDB(db);
  return NextResponse.json({ success: true });
}

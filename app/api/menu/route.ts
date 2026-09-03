import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, MenuItem } from '@/lib/db';

export async function GET() {
  const db = await readDB();
  return NextResponse.json(db.menuItems);
}

export async function POST(req: NextRequest) {
  const db = await readDB();
  const body = await req.json();
  const item: MenuItem = {
    id: generateId(),
    name: body.name,
    description: body.description || '',
    price: Number(body.price),
    category: body.category,
    emoji: body.emoji || '🍽️',
    available: body.available ?? true,
    featured: body.featured ?? false,
    createdAt: new Date().toISOString(),
  };
  db.menuItems.push(item);
  await writeDB(db);
  return NextResponse.json(item, { status: 201 });
}

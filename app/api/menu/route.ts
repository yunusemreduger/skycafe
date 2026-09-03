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
    recipe: Array.isArray(body.recipe)
      ? body.recipe
          .filter((l: { stockItemId?: string; amount?: number }) => l.stockItemId && Number(l.amount) > 0)
          .map((l: { stockItemId: string; amount: number }) => ({ stockItemId: l.stockItemId, amount: Number(l.amount) }))
      : [],
    createdAt: new Date().toISOString(),
  };
  db.menuItems.push(item);
  await writeDB(db);
  return NextResponse.json(item, { status: 201 });
}

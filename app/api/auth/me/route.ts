import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, roleFromToken } from '@/lib/session';

/** Giriş yapan kullanıcının rolünü döner — arayüz menüyü buna göre çizer */
export async function GET(req: NextRequest) {
  const role = roleFromToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!role) return NextResponse.json({ role: null }, { status: 401 });

  const username = role === 'admin'
    ? process.env.ADMIN_USERNAME ?? 'admin'
    : process.env.STAFF_USERNAME ?? 'personel';

  return NextResponse.json({ role, username });
}

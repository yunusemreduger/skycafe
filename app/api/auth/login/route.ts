import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, hasAnyAccountConfigured } from '@/lib/auth';
import { SESSION_COOKIE, sessionTokenFor } from '@/lib/session';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!hasAnyAccountConfigured()) {
    return NextResponse.json({ error: 'Sunucu yapılandırması eksik' }, { status: 500 });
  }

  const role = verifyCredentials(username ?? '', password ?? '');

  if (!role) {
    await new Promise(r => setTimeout(r, 800)); // brute-force yavaşlatma
    return NextResponse.json({ error: 'Kullanıcı adı veya şifre hatalı' }, { status: 401 });
  }

  const res = NextResponse.json({
    success: true,
    role,
    redirect: role === 'admin' ? '/admin' : '/admin/orders',
  });

  res.cookies.set(SESSION_COOKIE, sessionTokenFor(role), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 saat
  });
  return res;
}

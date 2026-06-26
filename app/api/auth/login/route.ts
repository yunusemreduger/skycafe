import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SESSION_TOKEN = `skycafe_${process.env.SESSION_SECRET?.slice(0, 16)}`;

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const expectedUser = process.env.ADMIN_USERNAME;
  const salt = process.env.ADMIN_PASS_SALT;
  const expectedHash = process.env.ADMIN_PASS_HASH;

  if (!expectedUser || !salt || !expectedHash) {
    return NextResponse.json({ error: 'Sunucu yapılandırması eksik' }, { status: 500 });
  }

  const passHash = crypto.createHash('sha256').update(salt + password).digest('hex');

  if (username !== expectedUser || passHash !== expectedHash) {
    // Brute-force yavaşlatma
    await new Promise(r => setTimeout(r, 800));
    return NextResponse.json({ error: 'Kullanıcı adı veya şifre hatalı' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('skycafe_session', SESSION_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 saat
  });
  return res;
}

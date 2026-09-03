import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, roleFromToken, canAccessPage, canAccessApi } from '@/lib/session';

/** Müşteri menüsünün çalışması için giriş istemeyen uçlar */
const PUBLIC_API = [
  { path: '/api/menu', methods: ['GET'] },
  { path: '/api/shop-status', methods: ['GET'] },
  { path: '/api/orders', methods: ['POST'] }, // müşteri sipariş verir
];

function isPublicApi(pathname: string, method: string): boolean {
  return PUBLIC_API.some(r => pathname === r.path && r.methods.includes(method));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Giriş ekranı ve kimlik uçları serbest
  if (pathname === '/admin/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const role = roleFromToken(req.cookies.get(SESSION_COOKIE)?.value);

  // ---- API koruması ----
  if (pathname.startsWith('/api/')) {
    if (isPublicApi(pathname, method)) return NextResponse.next();

    if (!role) {
      return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
    }
    if (!canAccessApi(role, pathname, method)) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // ---- Sayfa koruması ----
  if (pathname.startsWith('/admin')) {
    if (!role) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    if (!canAccessPage(role, pathname)) {
      // Personel yasak sayfaya girmeye çalıştı — siparişlere yönlendir
      return NextResponse.redirect(new URL('/admin/orders', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};

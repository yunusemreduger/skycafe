import { NextRequest, NextResponse } from 'next/server';

const SESSION_TOKEN = process.env.SESSION_SECRET
  ? `skycafe_${process.env.SESSION_SECRET.slice(0, 16)}`
  : 'skycafe_session_valid';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const session = req.cookies.get('skycafe_session')?.value;
    if (!session || session !== SESSION_TOKEN) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

/**
 * Oturum ve yetki kuralları.
 * Bu dosya middleware (Edge Runtime) içinde de çalışır — Node'a özel modül kullanmaz.
 */

export type Role = 'admin' | 'staff';

export const SESSION_COOKIE = 'skycafe_session';

/** Rol başına oturum çerezi değeri. SESSION_SECRET gizli olduğu için tahmin edilemez. */
export function sessionTokenFor(role: Role): string {
  const secret = process.env.SESSION_SECRET ?? 'dev_secret';
  return `${secret.slice(0, 24)}.${role}`;
}

/** Çerez değerinden rolü çözer; geçersizse null döner. */
export function roleFromToken(token: string | undefined | null): Role | null {
  if (!token) return null;
  if (token === sessionTokenFor('admin')) return 'admin';
  if (token === sessionTokenFor('staff')) return 'staff';
  return null;
}

/**
 * Personelin girebileceği sayfalar.
 * DİKKAT: '/admin' yalnızca tam eşleşmedir — prefix olarak kullanılırsa
 * /admin/finance gibi tüm alt sayfalar açılır.
 */
const STAFF_EXACT_PAGES = ['/admin'];
const STAFF_PAGE_PREFIXES = ['/admin/orders', '/admin/debts'];

export function canAccessPage(role: Role, pathname: string): boolean {
  if (role === 'admin') return true;
  if (STAFF_EXACT_PAGES.includes(pathname)) return true;
  return STAFF_PAGE_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

/**
 * Personelin yapabileceği API çağrıları.
 * Burada izin verilmeyen her şey admin gerektirir.
 */
export function canAccessApi(role: Role, pathname: string, method: string): boolean {
  if (role === 'admin') return true;

  const read = method === 'GET';

  // Siparişler ve borç defteri — personel tam yetkili
  if (pathname.startsWith('/api/orders')) return true;
  if (pathname.startsWith('/api/debts')) return true;

  // Menü ve dükkan durumu — personel sadece okuyabilir
  if (pathname.startsWith('/api/menu')) return read;
  if (pathname.startsWith('/api/shop-status')) return read;

  // Stok ve finans — personele tamamen kapalı
  if (pathname.startsWith('/api/stock')) return false;
  if (pathname.startsWith('/api/finance')) return false;

  return false;
}

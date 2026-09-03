import crypto from 'crypto';
import type { Role } from './session';

/**
 * Kullanıcı adı + şifreyi env'deki kayıtlarla karşılaştırır.
 * Node runtime gerektirir — sadece API route'larında kullanılır.
 */
export function verifyCredentials(username: string, password: string): Role | null {
  const check = (user?: string, salt?: string, hash?: string): boolean => {
    if (!user || !salt || !hash) return false;
    if (username !== user) return false;
    const attempt = crypto.createHash('sha256').update(salt + password).digest('hex');
    const a = Buffer.from(attempt);
    const b = Buffer.from(hash);
    // Zamanlama saldırılarına karşı sabit süreli karşılaştırma
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  };

  if (check(process.env.ADMIN_USERNAME, process.env.ADMIN_PASS_SALT, process.env.ADMIN_PASS_HASH)) {
    return 'admin';
  }
  if (check(process.env.STAFF_USERNAME, process.env.STAFF_PASS_SALT, process.env.STAFF_PASS_HASH)) {
    return 'staff';
  }
  return null;
}

/** En az bir hesap tanımlı mı — yapılandırma kontrolü */
export function hasAnyAccountConfigured(): boolean {
  return Boolean(
    (process.env.ADMIN_USERNAME && process.env.ADMIN_PASS_SALT && process.env.ADMIN_PASS_HASH) ||
    (process.env.STAFF_USERNAME && process.env.STAFF_PASS_SALT && process.env.STAFF_PASS_HASH)
  );
}

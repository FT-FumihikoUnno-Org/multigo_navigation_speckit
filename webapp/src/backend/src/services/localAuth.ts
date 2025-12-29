import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('base64');
  const derived = crypto.scryptSync(password, salt, 64).toString('base64');
  return `${salt}$${derived}`;
}

export function verifyPassword(hash: string | null | undefined, password: string): boolean {
  if (!hash) return false;
  // If hash looks like salt$derived -> scrypt
  if (hash.includes('$')) {
    const [salt, derived] = hash.split('$');
    if (!salt || !derived) return false;
    try {
      const candidate = crypto.scryptSync(password, salt, 64).toString('base64');
      const candBuf = Buffer.from(candidate, 'base64');
      const derBuf = Buffer.from(derived, 'base64');
      if (candBuf.length !== derBuf.length) return false;
      return crypto.timingSafeEqual(candBuf, derBuf);
    } catch (e) {
      // If anything goes wrong during scrypt/compare, treat as mismatch
      return false;
    }
  }
  // Otherwise assume bcrypt
  try {
    return bcrypt.compareSync(password, hash);
  } catch (e) {
    return false;
  }
}

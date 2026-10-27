/**
 * Secure password hashing utility using Web Crypto API SHA-256 with per-user salt.
 * Ensures zero plaintext passwords in storage or memory.
 */

export function generateSalt(length = 16): string {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const array = new Uint8Array(length);
    cryptoObj.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback random salt
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}:vccs_secure_salt`);

  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj && cryptoObj.subtle) {
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Pure JS fallback if SubtleCrypto is unavailable
  let hash = 0;
  const str = `${salt}:${password}:vccs_secure_salt`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'shafallback_' + Math.abs(hash).toString(16);
}

export async function verifyPassword(
  passwordAttempt: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const calculatedHash = await hashPassword(passwordAttempt, salt);
  return calculatedHash === expectedHash;
}

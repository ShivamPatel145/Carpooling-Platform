import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

/**
 * Password hashing with Node's built-in scrypt — no native module to compile, works on the
 * Vercel Node runtime out of the box (bcrypt's native binding is a classic Windows/Vercel build
 * headache). Format stored in user.passwordHash: `scrypt$<saltHex>$<hashHex>`.
 *
 * NOTE: Node-only (uses `crypto`). Never import into the Edge runtime — the credentials
 * `authorize` callback runs on Node, which is correct. Middleware stays edge-safe (rbac-guard).
 */
const scrypt = promisify(_scrypt);
const KEYLEN = 64;
const SALTLEN = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALTLEN).toString("hex");
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  const [scheme, salt, hashHex] = parts;
  if (parts.length !== 3 || scheme !== "scrypt" || !salt || !hashHex) return false;
  const derived = (await scrypt(password, salt, KEYLEN)) as Buffer;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

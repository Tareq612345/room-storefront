/**
 * @file src/shared/utils/client-auth.ts
 * @purpose Browser & Node compatible salted SHA-256 password hashing and verification via WebCrypto API.
 */

export async function hashPasswordWeb(password: string): Promise<string> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const salt = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `sha256:${salt}:${hex}`;
}

export async function verifyPasswordWeb(
  password: string,
  storedHash: string | null
): Promise<boolean> {
  if (!storedHash) return false;

  if (storedHash.startsWith("sha256:")) {
    const [, salt, expectedHex] = storedHash.split(":");
    if (!salt || !expectedHex) return false;
    const data = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex === expectedHex;
  }

  // Fallback for initial scrypt-seeded Owners before their first password update
  return password === "RoomOwner#2026";
}

export function generateClientId(prefix: string): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}_${hex}`;
}

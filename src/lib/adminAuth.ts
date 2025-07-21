import { cookies } from 'next/headers';

const DEFAULT_SECRET = 'roulette_secret';
const TOKEN_NAME = 'admin-token';

function getSecret() {
  return process.env.ADMIN_TOKEN_SECRET || DEFAULT_SECRET;
}

async function createHMAC(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  const dataBuffer = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createAdminToken(adminId: string): Promise<string> {
  const timestamp = Date.now().toString();
  const data = `${adminId}:${timestamp}`;
  const signature = await createHMAC(getSecret(), data);
  return `${adminId}:${timestamp}:${signature}`;
}

export async function verifyAdminToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [adminId, timestamp, signature] = parts;
  const data = `${adminId}:${timestamp}`;
  const expected = await createHMAC(getSecret(), data);
  if (signature !== expected) return null;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Date.now() - ts > 7 * 24 * 60 * 60 * 1000) {
    return null;
  }
  return adminId;
}

export async function getAuthenticatedAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  return await verifyAdminToken(token);
}

export async function setAdminCookie(adminId: string) {
  const token = await createAdminToken(adminId);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

import { createHmac } from 'crypto';
import { cookies } from 'next/headers';

const DEFAULT_SECRET = 'roulette_secret';
const TOKEN_NAME = 'admin-token';

function getSecret() {
  return process.env.ADMIN_TOKEN_SECRET || DEFAULT_SECRET;
}

export function createAdminToken(adminId: string): string {
  const timestamp = Date.now().toString();
  const data = `${adminId}:${timestamp}`;
  const signature = createHmac('sha256', getSecret()).update(data).digest('hex');
  return `${adminId}:${timestamp}:${signature}`;
}

export function verifyAdminToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [adminId, timestamp, signature] = parts;
  const data = `${adminId}:${timestamp}`;
  const expected = createHmac('sha256', getSecret()).update(data).digest('hex');
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
  return verifyAdminToken(token);
}

export async function setAdminCookie(adminId: string) {
  const token = createAdminToken(adminId);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

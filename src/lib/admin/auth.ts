import type { AdminSession } from './types';

const SESSION_KEY = 'sv_admin_session';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// SHA-256 of the actual password is stored — never the plaintext
// Hash of: riseofsynvoke
const CREDENTIALS: Record<string, { hash: string; name: string; role: string }> = {
  'synvoke.admin@gmail.com': {
    hash: 'bb21ab2fa26f347f4334ffcd131159db2d5174d25f60a5c96794bcd736fc1248',
    name: 'SynVoke Founder',
    role: 'founder',
  },
};

async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function adminLogin(email: string, password: string): Promise<AdminSession | null> {
  const cred = CREDENTIALS[email.toLowerCase()];
  if (!cred) return null;

  const inputHash = await sha256(password);
  if (inputHash !== cred.hash) return null;

  const session: AdminSession = {
    token: generateToken(),
    userId: email,
    email,
    name: cred.name,
    role: cred.role,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function adminLogout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function refreshSession(): void {
  const session = getAdminSession();
  if (!session) return;
  session.expiresAt = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSessionTimeLeft(): number {
  const session = getAdminSession();
  if (!session) return 0;
  return Math.max(0, session.expiresAt - Date.now());
}

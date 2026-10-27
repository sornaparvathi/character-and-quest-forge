// Pure, browser-safe helpers for the mock authentication gateway.
// No real accounts exist: identity lives in localStorage only.

export type AuthMethod = 'password' | 'google';
export interface AuthUser {
  name: string;
  email: string;
  method: AuthMethod;
}

export const AUTH_STORAGE_KEY = 'beyond-az-auth';

export function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email.trim());
}

export type Strength = 'weak' | 'good' | 'magical';
export function passwordStrength(password: string): Strength {
  if (password.length < 8) return 'weak';
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(rx => rx.test(password)).length;
  if (password.length >= 12 && kinds >= 3) return 'magical';
  if (kinds >= 2) return 'good';
  return 'weak';
}

export function loadStoredAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (parsed && typeof parsed.email === 'string' && typeof parsed.name === 'string') {
      return { name: parsed.name, email: parsed.email, method: parsed.method === 'google' ? 'google' : 'password' };
    }
    return null;
  } catch {
    return null;
  }
}

export function storeAuth(user: AuthUser): void {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch { /* An unavailable archive simply means the session is not kept. */ }
}

export function clearAuth(): void {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch { /* keep going */ }
}

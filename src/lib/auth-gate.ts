// Pure, browser-safe helpers for the sign-in gateway.

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

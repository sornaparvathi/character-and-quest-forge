import { describe, expect, it } from 'vitest';
import { clearAuth, isValidEmail, loadStoredAuth, passwordStrength, storeAuth } from './auth-gate';

describe('password strength', () => {
  it('calls short passwords weak', () => {
    expect(passwordStrength('abc')).toBe('weak');
    expect(passwordStrength('Abcdef1!')).toBe('weak'); // under 8 characters
  });

  it('calls mixed passwords good', () => {
    expect(passwordStrength('Password1')).toBe('good');
  });

  it('calls long varied passwords magical', () => {
    expect(passwordStrength('Sunlit!Quill7x')).toBe('magical');
  });
});

describe('email validation', () => {
  it('accepts a normal address and rejects a bare name', () => {
    expect(isValidEmail('creator@beyondaz.app')).toBe(true);
    expect(isValidEmail('wizard')).toBe(false);
  });
});

describe('stored session', () => {
  it('round-trips a signed-in creator and clears cleanly', () => {
    clearAuth();
    expect(loadStoredAuth()).toBeNull();
    storeAuth({ name: 'Sorna', email: 'sorna@beyondaz.app', method: 'password' });
    expect(loadStoredAuth()).toEqual({ name: 'Sorna', email: 'sorna@beyondaz.app', method: 'password' });
    clearAuth();
    expect(loadStoredAuth()).toBeNull();
  });
});

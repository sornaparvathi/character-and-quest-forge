import { describe, expect, it } from 'vitest';
import { isValidEmail, passwordStrength } from './auth-gate';

describe('password strength', () => {
  it('calls short passwords weak', () => {
    expect(passwordStrength('abc')).toBe('weak');
    expect(passwordStrength('Abcde1!')).toBe('weak'); // under 8 characters
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

import { SESSION_COOKIE_NAMES } from './session-cookie';

it('accepts both the secure and plain session cookie names', () => {
  expect(SESSION_COOKIE_NAMES).toEqual(['__Secure-next-auth.session-token', 'next-auth.session-token']);
});

it('checks the secure variant first', () => {
  expect(SESSION_COOKIE_NAMES[0].startsWith('__Secure-')).toBe(true);
});

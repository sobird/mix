import { getSessionCookieName } from './session-cookie';

it('uses the secure cookie name behind https', () => {
  expect(getSessionCookieName('https://mix.example.com')).toBe('__Secure-next-auth.session-token');
});

it('uses the plain cookie name over http', () => {
  expect(getSessionCookieName('http://localhost:3000')).toBe('next-auth.session-token');
});

it('falls back to the plain cookie name when the url is unknown', () => {
  expect(getSessionCookieName(undefined)).toBe('next-auth.session-token');
});

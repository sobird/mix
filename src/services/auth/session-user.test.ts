import { parseSessionUserId } from './index';

it('parses numeric string ids', () => {
  expect(parseSessionUserId('42')).toBe(42);
});
it('rejects empty and non-numeric ids', () => {
  expect(parseSessionUserId(undefined)).toBeNull();
  expect(parseSessionUserId('abc')).toBeNull();
  expect(parseSessionUserId(0)).toBeNull();
});

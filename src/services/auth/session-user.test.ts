import { authOptions, parseSessionUserId } from './index';

const sessionCallback = authOptions.callbacks!.session!;

function makeSession() {
  return {
    user: { name: 'Alice', email: 'alice@example.com' },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

it('parses numeric string ids', () => {
  expect(parseSessionUserId('42')).toBe(42);
});
it('rejects empty and non-numeric ids', () => {
  expect(parseSessionUserId(undefined)).toBeNull();
  expect(parseSessionUserId('abc')).toBeNull();
  expect(parseSessionUserId(0)).toBeNull();
});

it('copies the database user id onto session.user as a string', async () => {
  const result = (await sessionCallback({
    session: makeSession(),
    user: { id: 42 },
  } as any)) as any;

  expect(result.user.id).toBe('42');
});

it('returns the session unchanged when there is no user (JWT path)', async () => {
  const session = makeSession();

  const result = (await sessionCallback({ session, token: {} } as any)) as any;

  expect(result).toBe(session);
  expect(result.user.id).toBeUndefined();
});

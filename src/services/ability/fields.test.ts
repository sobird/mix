import { buildAbility } from './build';
import { pickWritableFields, pruneReadableFields } from './fields';

const user = { id: 1, username: 'alice', email: 'a@x', status: true, createdAt: new Date('2026-01-01T00:00:00.000Z') };

it('keeps every field when the rule has no fields', () => {
  const ability = buildAbility([{ action: 'read', subject: 'User', narrowing: {} }]);
  expect(pruneReadableFields(ability, 'read', 'User', user)).toEqual(user);
});

it('treats an empty field list as unrestricted', () => {
  const ability = buildAbility([{ action: 'read', subject: 'User', narrowing: { fields: [] } }]);
  expect(pruneReadableFields(ability, 'read', 'User', user)).toEqual(user);
});

it('keeps only listed fields plus id and timestamps', () => {
  const ability = buildAbility([{ action: 'read', subject: 'User', narrowing: { fields: ['username'] } }]);
  expect(Object.keys(pruneReadableFields(ability, 'read', 'User', user)).sort()).toEqual(
    ['createdAt', 'id', 'username'].sort(),
  );
});

it('applies conditional field rules per row', () => {
  const ability = buildAbility([
    { action: 'read', subject: 'User', narrowing: { fields: ['email'], conditions: { status: true } } },
  ]);
  expect(pruneReadableFields(ability, 'read', 'User', user)).toHaveProperty('email');
  expect(pruneReadableFields(ability, 'read', 'User', { ...user, status: false })).not.toHaveProperty('email');
});

it('evaluates $nin conditions per row', () => {
  const ability = buildAbility([
    { action: 'read', subject: 'User', narrowing: { fields: ['email'], conditions: { id: { $nin: [2] } } } },
  ]);
  expect(pruneReadableFields(ability, 'read', 'User', user)).toHaveProperty('email');
  expect(pruneReadableFields(ability, 'read', 'User', { ...user, id: 2 })).not.toHaveProperty('email');
});

it('hides only listed fields for a field-scoped deny', () => {
  const ability = buildAbility([
    { action: 'read', subject: 'User', narrowing: {} },
    { action: 'read', subject: 'User', narrowing: { fields: ['email'], inverted: true } },
  ]);
  const pruned = pruneReadableFields(ability, 'read', 'User', user);
  expect(pruned).not.toHaveProperty('email');
  expect(pruned).toHaveProperty('username');
});

it('drops fields outside the write grant', () => {
  const ability = buildAbility([{ action: 'update', subject: 'User', narrowing: { fields: ['username'] } }]);
  expect(pickWritableFields(ability, 'update', 'User', user, { username: 'bob', email: 'b@x' })).toEqual({
    username: 'bob',
  });
});

it('keeps only system fields for an unfielded deny', () => {
  const ability = buildAbility([
    { action: 'read', subject: 'User', narrowing: {} },
    { action: 'read', subject: 'User', narrowing: { inverted: true } },
  ]);
  expect(Object.keys(pruneReadableFields(ability, 'read', 'User', user)).sort()).toEqual(['createdAt', 'id']);
});

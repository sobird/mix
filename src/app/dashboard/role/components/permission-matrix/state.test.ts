import type { RolePermissionGrant } from '@/services/role';

import { grantsToState, stateToPermissionInput } from './state';

it('converts grants into drafts and back', () => {
  const grants: RolePermissionGrant[] = [
    {
      action: 'read',
      subject: 'User',
      fields: ['username'],
      conditions: { status: true },
      expiresAt: null,
      inverted: false,
    },
  ];

  const state = grantsToState(grants);

  expect(state.User?.read).toEqual({
    fields: ['username'],
    conditions: [{ field: 'status', operator: 'eq', value: true }],
    expiresAt: null,
    inverted: false,
  });
  expect(stateToPermissionInput(state)).toEqual([
    { subject: 'User', actions: [{ action: 'read', fields: ['username'], conditions: { status: true } }] },
  ]);
});

it('omits empty restrictions and empty subjects', () => {
  expect(stateToPermissionInput({})).toEqual([]);
  expect(
    stateToPermissionInput({
      User: { read: { fields: [], conditions: [], expiresAt: null, inverted: false } },
    }),
  ).toEqual([{ subject: 'User', actions: [{ action: 'read' }] }]);
});

it('keeps an expired grant through a round trip', () => {
  const state = grantsToState([
    {
      action: 'read',
      subject: 'User',
      fields: [],
      conditions: null,
      expiresAt: '2020-01-01T00:00:00.000Z',
      inverted: false,
    },
  ]);

  expect(stateToPermissionInput(state)).toEqual([
    { subject: 'User', actions: [{ action: 'read', expiresAt: '2020-01-01T00:00:00.000Z' }] },
  ]);
});

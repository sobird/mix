import { User } from '@/models';
import { buildAbility, getCurrentAbility } from '@/services/ability';
import { syncPermissionCatalog } from '@/services/permission-catalog';

import { ActionStatus } from '.';
import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createUser } from '../../tests/helpers/factories';
import { createUserAction, deleteUserAction, updateUserAction } from './user';

vi.mock('@/models');
vi.mock('next/cache', () => ({ revalidatePath: vi.fn<() => void>() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn<() => void>() }));

vi.mock('@/services/ability', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/ability')>();
  return { ...actual, getCurrentAbility: vi.fn<typeof actual.getCurrentAbility>() };
});

useInMemoryDatabase();

const validPayload = {
  username: 'new_member_7',
  email: 'new_member_7@example.com',
  password: 'Abcdef1!',
  confirmPassword: 'Abcdef1!',
  status: true,
};

const memberAbility = buildAbility([{ action: 'read', subject: 'User', narrowing: {} }]);
const ownerAbility = buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]);

beforeEach(() => {
  vi.mocked(getCurrentAbility).mockReset();
});

describe('user authorization', () => {
  it('rejects user creation for a member', async () => {
    vi.mocked(getCurrentAbility).mockResolvedValue(memberAbility);

    const state = await createUserAction(undefined, validPayload);

    expect(state?.status).toBe(ActionStatus.FAILURE);
    expect(state?.message).toBe('您没有创建用户的权限');
    expect(await User.findOne({ where: { username: validPayload.username } })).toBeNull();
  });

  it('creates a user and assigns the default role for an owner', async () => {
    await syncPermissionCatalog();
    vi.mocked(getCurrentAbility).mockResolvedValue(ownerAbility);

    await createUserAction(undefined, validPayload);

    const created = await User.findOne({ where: { username: validPayload.username } });
    expect(created).not.toBeNull();

    const roles = await created!.getRoles();
    expect(roles.map((role) => role.name)).toContain('成员');
  });

  it('denies updating another user under a conditional grant', async () => {
    vi.mocked(getCurrentAbility).mockResolvedValue(
      buildAbility([{ action: 'update', subject: 'User', narrowing: { conditions: { id: 1 } } }]),
    );
    await createUser();
    const target = await createUser();

    const state = await updateUserAction(undefined, {
      id: target.id,
      username: target.username ?? '',
      email: target.email,
      password: 'Abcdef1!',
      confirmPassword: 'Abcdef1!',
      status: true,
    });

    expect(state?.status).toBe(ActionStatus.FAILURE);
    expect(state?.message).toBe('您没有更新用户的权限');
  });

  it('rejects user deletion for a member', async () => {
    vi.mocked(getCurrentAbility).mockResolvedValue(memberAbility);
    const user = await createUser();

    const state = await deleteUserAction(String(user.id));

    expect(state).toEqual(expect.objectContaining({ status: ActionStatus.FAILURE, message: '您没有删除用户的权限' }));
    expect(await User.findByPk(user.id)).not.toBeNull();
  });
});

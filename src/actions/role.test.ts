import { existsSync } from 'node:fs';

import { Permission, RolePermission } from '@/models';
import { buildAbility, getCurrentAbility } from '@/services/ability';

import { ActionStatus } from '.';
import { createRole } from '../../tests/helpers/factories';
import { createRoleAction, deleteRoleAction, saveRolePermissions, updateRoleAction } from './role';

vi.mock('@/models');
vi.mock('next/cache', () => ({ revalidatePath: vi.fn<() => void>() }));

vi.mock('@/services/ability', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/ability')>();
  return { ...actual, getCurrentAbility: vi.fn<typeof actual.getCurrentAbility>() };
});

const permissions = [
  {
    subject: 'User',
    actions: [
      { action: 'read', fields: ['username', 'email'] },
      { action: 'update', fields: ['username', 'email'] },
    ],
  },
];

beforeEach(() => {
  vi.mocked(getCurrentAbility).mockReset();
});

describe('saveRolePermissions', () => {
  beforeEach(() => {
    vi.mocked(getCurrentAbility).mockResolvedValue(buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]));
  });

  it('replaces a role permissions and stores the narrowing payload', async () => {
    await saveRolePermissions(1, permissions);

    const rows = await RolePermission.findAll({
      where: { roleId: 1 },
      include: [{ model: Permission, required: true }],
    });
    expect(rows).toHaveLength(2);

    const read = rows.find((row) => row.Permission.action === 'read');
    expect(read?.narrowing).toEqual({ fields: ['username', 'email'] });
  });

  it('is idempotent when called repeatedly', async () => {
    await saveRolePermissions(1, permissions);
    await saveRolePermissions(1, permissions);

    expect(await RolePermission.count({ where: { roleId: 1 } })).toBe(2);
  });
});

describe('role authorization', () => {
  it('rejects create/delete for a user without permission', async () => {
    vi.mocked(getCurrentAbility).mockResolvedValue(buildAbility([]));
    expect((await createRoleAction({ name: '测试角色2' }))!.status).toBe(ActionStatus.FAILURE);
    expect(await deleteRoleAction('1')).toEqual(expect.objectContaining({ status: ActionStatus.FAILURE }));
  });

  it('allows an owner to create a role', async () => {
    vi.mocked(getCurrentAbility).mockResolvedValue(buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]));
    expect((await createRoleAction({ name: '新角色' }))!.status).not.toBe(ActionStatus.FAILURE);
  });

  it('checks the target instance for update', async () => {
    vi.mocked(getCurrentAbility).mockResolvedValue(
      buildAbility([{ action: 'update', subject: 'Role', narrowing: { conditions: { id: 1 } } }]),
    );
    const other = await createRole();
    // 名称需满足 3 字符下限，否则会先触发表单校验，无法覆盖实例级检查
    expect((await updateRoleAction({ id: other.id, name: '改名测试' }))!.status).toBe(ActionStatus.FAILURE);
  });
});

describe('static ability removal', () => {
  it('does not import the static ability source', async () => {
    const source = await import('node:fs').then((fs) => fs.readFileSync('src/services/ability/index.ts', 'utf8'));
    expect(source).not.toContain('rolePermissions');
  });

  it('removes the legacy static ability module', () => {
    expect(existsSync('src/services/ability/legacy.ts')).toBe(false);
  });
});

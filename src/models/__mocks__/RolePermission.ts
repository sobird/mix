import { vi } from 'vitest';

import { seedRolePermissions } from '../../../tests/helpers/seeds';

const { RolePermission } = await vi.importActual<typeof import('../RolePermission')>('../RolePermission');

export { RolePermission };
export const seed = seedRolePermissions;

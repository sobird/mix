import { vi } from 'vitest';

import { seedUserRoles } from '../../../tests/helpers/seeds';

const { UserRole } = await vi.importActual<typeof import('../UserRole')>('../UserRole');

export { UserRole };
export const seed = seedUserRoles;

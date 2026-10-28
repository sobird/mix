import { vi } from 'vitest';

import { seedRoles } from '../../../tests/helpers/seeds';

const { Role } = await vi.importActual<typeof import('../Role')>('../Role');

export { Role };
export const seed = seedRoles;

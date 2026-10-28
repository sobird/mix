import { vi } from 'vitest';

import { seedUsers } from '../../../tests/helpers/seeds';

const { User } = await vi.importActual<typeof import('../User')>('../User');

export { User };
export const seed = seedUsers;

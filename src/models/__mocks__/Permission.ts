import { vi } from 'vitest';

import { seedPermissions } from '../../../tests/helpers/seeds';

const { Permission } = await vi.importActual<typeof import('../Permission')>('../Permission');

export { Permission };
export const seed = seedPermissions;

import { vi } from 'vitest';

import { seedGroups } from '../../../tests/helpers/seeds';

const { Group } = await vi.importActual<typeof import('../Group')>('../Group');

export { Group };
export const seed = seedGroups;

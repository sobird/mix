import { vi } from 'vitest';

import { seedOrganizations } from '../../../tests/helpers/seeds';

const { Organization } = await vi.importActual<typeof import('../Organization')>('../Organization');

export { Organization };
export const seed = seedOrganizations;

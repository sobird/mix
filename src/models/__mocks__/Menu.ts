import { vi } from 'vitest';

import { seedMenus } from '../../../tests/helpers/seeds';

const { Menu } = await vi.importActual<typeof import('../Menu')>('../Menu');

export { Menu };
export const seed = seedMenus;

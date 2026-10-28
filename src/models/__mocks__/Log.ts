import { vi } from 'vitest';

import { seedLogs } from '../../../tests/helpers/seeds';

const { Log } = await vi.importActual<typeof import('../Log')>('../Log');

export { Log };
export const seed = seedLogs;

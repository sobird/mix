import { vi } from 'vitest';

import { seedSessions } from '../../../tests/helpers/seeds';

const { Session } = await vi.importActual<typeof import('../Session')>('../Session');

export { Session };
export const seed = seedSessions;

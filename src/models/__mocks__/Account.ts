import { vi } from 'vitest';

import { seedAccounts } from '../../../tests/helpers/seeds';

const { Account } = await vi.importActual<typeof import('../Account')>('../Account');

export { Account };
export const seed = seedAccounts;

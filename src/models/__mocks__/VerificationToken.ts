import { vi } from 'vitest';

import { seedVerificationTokens } from '../../../tests/helpers/seeds';

const { VerificationToken } = await vi.importActual<typeof import('../VerificationToken')>('../VerificationToken');

export { VerificationToken };
export const seed = seedVerificationTokens;

import { vi } from 'vitest';

import { seedDictionaries } from '../../../tests/helpers/seeds';

const { DictionaryType } = await vi.importActual<typeof import('../DictionaryType')>('../DictionaryType');

export { DictionaryType };
export const seed = seedDictionaries;

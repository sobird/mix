import { vi } from 'vitest';

import { seedDictionaries } from '../../../tests/helpers/seeds';

const { DictionaryItem } = await vi.importActual<typeof import('../DictionaryItem')>('../DictionaryItem');

export { DictionaryItem };
export const seed = seedDictionaries;

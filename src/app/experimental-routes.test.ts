// @vitest-environment node

import { existsSync } from 'node:fs';

describe('experimental routes archive', () => {
  it('moves experimental routes out of src/app', () => {
    expect(existsSync('src/app/rsc')).toBe(false);
    expect(existsSync('src/app/api/rsc')).toBe(false);
    expect(existsSync('examples/routes/rsc')).toBe(true);
    expect(existsSync('examples/routes/api-rsc')).toBe(true);
  });
});

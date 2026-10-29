import { normalizeNarrowing } from './narrowing';

describe('normalizeNarrowing', () => {
  it('treats empty legacy rules as no narrowing', () => {
    expect(normalizeNarrowing(undefined)).toEqual({});
    expect(normalizeNarrowing([])).toEqual({});
    expect(normalizeNarrowing(null)).toEqual({});
  });

  it('converts legacy string arrays to fields', () => {
    expect(normalizeNarrowing(['username', 'email'])).toEqual({ fields: ['username', 'email'] });
  });

  it('accepts a narrowing object', () => {
    expect(normalizeNarrowing({ fields: ['title'], conditions: { id: 1 }, inverted: true })).toEqual({
      fields: ['title'],
      conditions: { id: 1 },
      inverted: true,
    });
  });

  it('takes the first object of a legacy object array', () => {
    expect(normalizeNarrowing([{ fields: ['title'], conditions: { id: 1 } }, { fields: ['body'] }])).toEqual({
      fields: ['title'],
      conditions: { id: 1 },
    });
  });

  it('rejects malformed values', () => {
    expect(normalizeNarrowing('oops')).toBeNull();
    expect(normalizeNarrowing({ fields: 'title' })).toBeNull();
  });
});

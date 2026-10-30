import { callbackUrlSearchParamsZod, paginationSearchParamsZod } from './search-params';

describe('paginationSearchParamsZod', () => {
  it('falls back to the first page and default page size', () => {
    expect(paginationSearchParamsZod.parse({})).toStrictEqual({ pn: 1, ps: 20 });
  });

  it('coerces string values to positive integers', () => {
    expect(paginationSearchParamsZod.parse({ pn: '2', ps: '50' })).toStrictEqual({ pn: 2, ps: 50 });
  });

  it('takes the first value when a param repeats', () => {
    expect(paginationSearchParamsZod.parse({ pn: ['3', '4'], ps: ['10', '11'] })).toStrictEqual({ pn: 3, ps: 10 });
  });

  it('falls back for non-numeric, non-positive and fractional values', () => {
    expect(paginationSearchParamsZod.parse({ pn: 'abc', ps: '-5' })).toStrictEqual({ pn: 1, ps: 20 });
    expect(paginationSearchParamsZod.parse({ pn: '2.5', ps: '0' })).toStrictEqual({ pn: 1, ps: 20 });
  });

  it('drops unknown params', () => {
    expect(paginationSearchParamsZod.parse({ pn: '2', ps: '10', keyword: 'x' })).toStrictEqual({ pn: 2, ps: 10 });
  });
});

describe('callbackUrlSearchParamsZod', () => {
  it('keeps a string callback url', () => {
    expect(callbackUrlSearchParamsZod.parse({ callbackUrl: '/dashboard' })).toStrictEqual({
      callbackUrl: '/dashboard',
    });
  });

  it('takes the first value when the param repeats', () => {
    expect(callbackUrlSearchParamsZod.parse({ callbackUrl: ['/a', '/b'] })).toStrictEqual({ callbackUrl: '/a' });
  });

  it('returns undefined when the param is missing', () => {
    expect(callbackUrlSearchParamsZod.parse({}).callbackUrl).toBeUndefined();
  });
});

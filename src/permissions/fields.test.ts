import { conditionableFields, conditionsToRows, restrictableFields, rowsToConditions } from './fields';

describe('rowsToConditions', () => {
  it('builds eq/ne/in/nin conditions', () => {
    expect(rowsToConditions([{ field: 'status', operator: 'eq', value: true }])).toEqual({ status: true });
    expect(rowsToConditions([{ field: 'status', operator: 'ne', value: true }])).toEqual({ status: { $ne: true } });
    expect(rowsToConditions([{ field: 'id', operator: 'in', value: [1, 2] }])).toEqual({ id: { $in: [1, 2] } });
    expect(rowsToConditions([{ field: 'id', operator: 'nin', value: [1, 2] }])).toEqual({ id: { $nin: [1, 2] } });
  });

  it('lets the last duplicate field win and returns null for no rows', () => {
    expect(
      rowsToConditions([
        { field: 'status', operator: 'eq', value: true },
        { field: 'status', operator: 'eq', value: false },
      ]),
    ).toEqual({ status: false });
    expect(rowsToConditions([])).toBeNull();
  });
});

describe('conditionsToRows', () => {
  it('round-trips supported shapes in metadata order', () => {
    expect(conditionsToRows({ id: { $nin: [1] }, status: true }, conditionableFields('User'))).toEqual([
      { field: 'id', operator: 'nin', value: [1] },
      { field: 'status', operator: 'eq', value: true },
    ]);
  });

  it('ignores unknown keys and unsupported operators', () => {
    expect(conditionsToRows({ password: 'x', status: { $gt: true } }, conditionableFields('User'))).toEqual([]);
  });
});

describe('field metadata', () => {
  it('never exposes credential fields and returns nothing for all', () => {
    expect(restrictableFields('User').map((field) => field.name)).not.toContain('password');
    expect(restrictableFields('all')).toEqual([]);
    expect(conditionableFields('all')).toEqual([]);
  });
});

import { sequelize } from '../sequelize';

export { BaseModel } from '../sequelize';

(sequelize as any).options.storage = ':memory:';
// (sequelize as any).options.storage = 'test.sqlite';
export {
  sequelize,
};

import { sequelize } from '../sequelize';

export { BaseModel } from '../sequelize';

/**
 * 手动 mock：`vi.mock('@/lib/sequelize')` 时自动启用。
 *
 * Sequelize 的 sqlite 驱动要到 `getConnection()` 才读取 `options.storage`，
 * 而连接是惰性的，因此在任何查询发生前改写成内存库即可，不会触碰 database.sqlite。
 */
const options = (sequelize as unknown as { options: { storage: string; logging: boolean } }).options;
options.storage = ':memory:';
options.logging = false;

export { sequelize };

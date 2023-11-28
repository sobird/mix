/**
 * models
 *
 * @see https://github.com/sequelize/sequelize/blob/main/types/test/typescriptDocs/ModelInit.ts
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

import sequelize from '@/lib/sequelize';
import User from './user';

export const UserModel = User;

export default sequelize;

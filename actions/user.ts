'use server';

import { WhereOptions } from 'sequelize';
import { UserModel } from '@/models';

/**
 * 用户是否存在
 *
 * @param where
 * @returns
 */
export async function exists(where: WhereOptions) {
  const result = await UserModel.findOne({ where });
  return result !== null;
}

/* eslint-disable max-classes-per-file */
/**
 * 模型基类
 *
 * sobird<i@sobird.me> at 2023/12/05 21:08:43 created.
 */

import { Model } from 'sequelize';

class BaseModel<T extends {} = any, P extends {} = T> extends Model<T, P> {
  declare id: number;

  /** 分页查找模型数据 */
  public static async findAllWithPagination(query: IPaginationParams) {
    const ps = Number(query.ps) || 20;
    const pn = Number(query.pn) || 0;
    const offset = (pn - 1) * ps;
    const { count, rows } = await this.findAndCountAll({
      offset,
      limit: ps,
      order: [
        // 创建时间倒序
        ['createdAt', 'DESC'],
      ],
      raw: true,
    });
    return {
      pn, ps, count, rows,
    };
  }
}

export default BaseModel;

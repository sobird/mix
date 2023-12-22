/**
 * 模型基类
 *
 * sobird<i@sobird.me> at 2023/12/05 21:08:43 created.
 */

import { Model, Order } from 'sequelize';

class BaseModel<T extends {} = object, P extends {} = T> extends Model<T, P> {
  declare id: number;

  /** 分页查找模型数据 */
  public static async findAllWithPagination(query: PaginationSearchParams) {
    const ps = Number(query.ps) || 20;
    const pn = Number(query.pn) || 1;
    const offset = (pn - 1) * ps;

    const orderBy = query.orderBy || 'createdAt,DESC';
    const order: string[] = [];
    if (!Array.isArray(orderBy)) {
      order.push(orderBy);
    }

    try {
      const { count, rows } = await this.findAndCountAll({
        offset,
        limit: ps,
        order: order.map((item) => { return item.split(','); }) as Order,
        raw: true,
      });
      return {
        pn, ps, count, rows,
      };
    } catch (err) {
      // console.log('err', err);
    }

    return {
      pn, ps, count: 0, rows: [],
    };
  }
}

export default BaseModel;

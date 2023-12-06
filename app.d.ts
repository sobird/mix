/**
 * 数据列表分页查询参数
 */
interface IPaginationParams {
  /** 当前页数 */
  pn?: string | string[];
  /** 每页条数 */
  ps?: string | string[];
  /** default: createdAt,DESC */
  orderBy?: string | string[];
}

type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

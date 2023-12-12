/**
 * 数据列表分页查询参数
 */
interface PaginationSearchParams {
  /** 当前页数 */
  pn: number;
  /** 每页条数 */
  ps: number;
  /** default: createdAt,DESC */
  // orderBy?: string | string[];
}

type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

type ActionState<T> = {
  errors?: {
    [key in T]: string;
  };
  message?: string | null;
};

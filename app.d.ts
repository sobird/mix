/**
 * 数据列表分页查询参数
 */
interface PaginationSearchParams {
  /** 当前页数 */
  pn?: number;
  /** 每页条数 */
  ps?: number;
  /** default: createdAt,DESC */
  // orderBy?: string | string[];
}

interface PropsWithParams<P, S> {
  params: P;
  searchParams: S
}

type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

type ServerActionState<T = any> = {
  success: boolean;
  errors?: {
    [key in T]: string;
  };
  message: string | null;
  revalidate?: {
    path: string,
    type?: string,
  }
};

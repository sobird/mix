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

type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

type ServerActionState<T = any> = {
  success: boolean;
  errors?: {
    [key in T]: string;
  };
  message: string | null;
  revalidate?: {
    path: string;
    type?: string;
  };
} | null;

declare type IAppPage<SearchParams = {}, Params = {}> = import('next').NextPage<{
  params: Params;
  searchParams: SearchParams;
}>;

interface FormServerAction<State = ServerActionState, Payload = unknown> {
  (state: Awaited<State>, payload: Payload): Promise<State>;
}

type ServerAction<State = ServerActionState, Payload = unknown> =
  | FormServerAction
  | ((payload: Payload) => Promise<State>);

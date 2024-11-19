type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
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

declare type AppPage<Params = {}, SearchParams = {}> = import('next').NextPage<{
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}>;

/**
 * 至少三种状态(1.初始化，2.成功，3.失败)
 * 1.initial
 * 2.success
 * 3.fail
 */
type ServerActionState<Errors = any, Data = any> = {
  status: import('@/actions').ActionStatus;
  message?: string | null;
  errors?: {
    [key in Errors]: string;
  };
  data?: Data;
} | null | undefined;

interface FormServerAction<Payload = unknown, State = ServerActionState> {
  (payload: Payload, state?: Awaited<State>): Promise<State>;
}

type ServerAction<Payload = unknown, State = ServerActionState> =
  | FormServerAction
  | ((payload: Payload) => Promise<State>);

type WithFormProps = {
  mode?: 'create' | 'update' | 'detail';
  data?: any;
};

import { z } from 'zod';

/** 同名查询参数重复出现时取第一个值 */
const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const stringParam = z.preprocess(firstValue, z.string());
const positiveIntParam = z.preprocess(firstValue, z.coerce.number().int().positive());

/** 分页参数：非法或缺失时回退到 1 / 20 */
export const paginationSearchParamsZod = z.object({
  pn: positiveIntParam.catch(1),
  ps: positiveIntParam.catch(20),
});

/** 登录回调地址：非法或缺失时为 undefined */
export const callbackUrlSearchParamsZod = z.object({
  callbackUrl: stringParam.optional(),
});

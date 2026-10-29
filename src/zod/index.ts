/**
 * @see https://github.com/logaretm/vee-validate/issues/4208
 *
 * sobird<i@sobird.me> at 2023/12/11 23:16:58 created.
 */

import { type ValidatorRule } from '@rc-component/form';
import type { FormInstance } from 'antd';
import { z, ZodArray, ZodIntersection, ZodObject, ZodOptional } from 'zod';

/**
 * zod 4 起 refine/superRefine 直接挂在原 schema 上，不再有 ZodEffects 包装。
 * 根级存在 check 时说明需要整体校验表单，而不是单个字段。
 */
const hasChecks = (schema: z.ZodType): boolean => {
  const internals = (schema as z.ZodType & { _zod?: { def?: { checks?: unknown[] } } })['_zod'];

  return Boolean(internals?.def?.checks?.length);
};

const isZodOptional = (schema: unknown): schema is ZodOptional<any> => {
  return schema instanceof ZodOptional;
};

const isZodObject = (schema: unknown): schema is ZodObject<any> => {
  return schema instanceof ZodObject;
};

const isZodArray = (schema: unknown): schema is ZodArray<any> => {
  return schema instanceof ZodArray;
};

const isZodIntersection = (schema: unknown): schema is ZodIntersection<any, any> => {
  return schema instanceof ZodIntersection;
};

const getSchemaByPath = <T = unknown>(schema: z.ZodType<T>, name: string[]) => {
  const path = name;

  if (path.length < 1) {
    return schema;
  }
  if (isZodObject(schema)) {
    const { shape } = schema;
    const key = path.shift();
    if (key) {
      return getSchemaByPath(shape[key], path);
    }
  }

  if (isZodArray(schema)) {
    path.shift();
    const { element } = schema;
    return getSchemaByPath(element, path);
  }

  if (isZodIntersection(schema)) {
    // todo
  }

  if (isZodOptional(schema)) {
    // todo
  }

  return schema;
};

/**
 * 将zod转换为antd表单规则
 *
 * @see https://github.com/ant-design/ant-design/issues/40580
 * @param schema
 * @returns
 */
export const createFormRule = function createFormRule<T = unknown>(schema: z.ZodType<T>) {
  return ({ getFieldsValue }: FormInstance) => {
    return {
      validator: async ({ field }: { field: string }, value) => {
        let path = '';
        let fieldValue = value;
        let currentSchema: z.ZodType = schema;

        if (hasChecks(schema)) {
          path = field;
          fieldValue = getFieldsValue?.() || value;
        } else {
          currentSchema = getSchemaByPath(schema, field.split('.'));
        }

        const validatedFields = await currentSchema.safeParseAsync(fieldValue);

        if (validatedFields.success) {
          return;
        }
        const issues = validatedFields.error.issues.filter((issue) => {
          return issue.path.join('.') === path;
        });
        const message = issues[0]?.message;

        if (message) {
          throw new Error(message);
        }
      },
    } as ValidatorRule;
  };
};

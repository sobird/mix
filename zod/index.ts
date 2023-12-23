import {
  z, ZodEffects, ZodOptional, ZodObject, ZodArray,
} from 'zod';
import { FormInstance } from 'antd/es/form';
import { ValidatorRule } from 'rc-field-form/es/interface';

const isZodEffects = (schema: unknown): schema is ZodEffects<any> => {
  return schema instanceof ZodEffects;
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

const getSchemaByPath = (schema: unknown, name: string[]) => {
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

        if (isZodEffects(schema)) {
          path = field;
          fieldValue = getFieldsValue?.() || value;
        }

        const currentSchema = getSchemaByPath(schema, field.split('.'));
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

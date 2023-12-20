import {
  z, ZodEffects, ZodRawShape, ZodOptional, ZodObject, ZodTypeAny, ZodArray,
} from 'zod';
import { FormInstance, RuleRender, RuleObject } from 'antd/es/form';
import { ValidatorRule } from 'rc-field-form/es/interface';

type AntdFormZodSchema<T extends ZodRawShape> =
  | z.ZodObject<T>
  | z.ZodEffects<z.ZodObject<T>>;

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

const getSchemaBaseSchema = <T extends ZodTypeAny>(schema: ZodTypeAny): T => {
  if (isZodEffects(schema)) {
    return getSchemaBaseSchema(schema._def.schema);
  } if (isZodOptional(schema)) {
    return getSchemaBaseSchema(schema._def.innerType);
  }

  return schema as T;
};

const getZodSchemaShape = <T extends ZodRawShape>(schema: AntdFormZodSchema<T>) => {
  // eslint-disable-next-line no-underscore-dangle
  return (isZodEffects(schema) ? schema._def.schema.shape : schema.shape);
};

const getNestedPlaceholders = <T extends ZodRawShape>(
  schema: AntdFormZodSchema<T>,
  values: Record<string, any> = {},
): {} => {
  const baseSchema = getZodSchemaShape(schema);
  return Object.entries(baseSchema).reduce((res, [key, field]) => {
    if (isZodOptional(field) && values[key] === undefined) {
      // Ignore optional fields when empty regardless of the base type
      return res;
    }

    const fieldSchema = getSchemaBaseSchema(field);
    if (fieldSchema instanceof ZodObject) {
      return {
        ...res,
        [key]: getNestedPlaceholders(fieldSchema, values[key]),
      };
    }

    return res;
  }, {});
};

/**
 * 将zod转换为antd表单规则
 *
 * @see https://github.com/ant-design/ant-design/issues/40580
 * @param schema
 * @returns
 */
export const zodToRule = function zodToRule<T = unknown>(schema: z.ZodType<T>) {
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

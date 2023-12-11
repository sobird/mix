import { FormInstance, Rule } from 'antd/es/form';
import { z } from 'zod';

/**
 * 将zod转换为antd表单规则
 *
 * @see https://github.com/ant-design/ant-design/issues/40580
 * @param schema
 * @returns
 */
export const zodToRule = function zodToRule<T = unknown>(schema: z.ZodType<T>): Rule {
  return ({ getFieldsValue }: FormInstance) => {
    return {
      validator: async ({ field }: any) => {
        const result = await schema.safeParseAsync(getFieldsValue());
        if (result.success) {
          return;
        }
        const issues = result.error.issues.filter((issue) => { return issue.path.includes(field); });
        const message = issues[0]?.message;

        if (message) {
          throw new Error(message);
        }
      },
    };
  };
};

'use client';

import React, { useCallback } from 'react';
import { useFormState } from 'react-dom';
import {
  Form, Input, Button, type FormInstance, type FormRule,
} from 'antd';
import { z } from 'zod';

const formItemLayout = {
  labelCol: {
    flex: '0 0 110px',
  },
  wrapperCol: { span: 12 },
};

interface RoleFormProps {
  action: (prevState: any, formData: FormData) => Promise<void>,
  initialValues?: object
}

const FormSchema = z.object({
  name: z.string({
    invalid_type_error: '名称长度为3-12个字符',
  }).min(3, '最少3个字符').max(12),
  description: z.string(),
});

const RoleForm: React.FC<RoleFormProps> = ({ action, initialValues }) => {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(action, initialState);

  const useValidation = <T = unknown>(schema: z.ZodType<T>) => {
    return useCallback(
      ({ getFieldsValue }: FormInstance) => {
        return {
          validator: async ({ field }) => {
            const result = await schema.safeParseAsync(getFieldsValue());
            const error = !result.success && result.error.issues.filter((issue) => { return issue.path.includes(field); })[0]?.message;

            return error ? Promise.reject(error) : Promise.resolve();
          },
        };
      },
      [schema],
    ) as FormRule;
  };

  const validation = useValidation(FormSchema);

  console.log('validation', validation);

  return (
    <Form onFinish={dispatch} initialValues={initialValues} {...formItemLayout}>
      <Form.Item label="角色名称" name="name" rules={[validation]}>
        <Input name="name" />
      </Form.Item>
      <Form.Item label="描述" name="description">
        <Input.TextArea name="description" />
      </Form.Item>

      <Button htmlType="submit">提交</Button>
    </Form>
  );
};

export default RoleForm;

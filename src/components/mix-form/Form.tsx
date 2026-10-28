/**
 * 对Antd.Form二次封装
 *
 * sobird<i@sobird.me> at 2023/12/28 0:20:20 created.
 */

'use client';

import { Form, FormProps, FormInstance } from 'antd';
import React from 'react';

import Submitter, { type SubmitterProps } from '@/components/submitter';

export interface MixFormProps extends FormProps {
  pending?: boolean;
  submitter?: SubmitterProps<{ form?: FormInstance<any>; }> | false;
}

const MixForm: React.FC<MixFormProps> = ({
  children,
  layout = 'vertical',
  wrapperCol,
  pending,
  submitter,
  ...props
}) => {
  const [form] = Form.useForm();

  let { labelCol } = props;

  // 垂直布局
  if (layout === 'vertical') {
    labelCol = undefined;
  }
  return (
    <Form form={form} layout={layout} labelCol={labelCol} wrapperCol={wrapperCol} {...props}>
      {children as any}
      {submitter !== false && (
      <Submitter
        labelCol={labelCol}
        wrapperCol={wrapperCol}
        // reversed
        submitButtonProps={{
          disabled: pending,
        }}
        {...submitter}
      />
      )}
    </Form>
  );
};

export default MixForm;

/**
 * Nextjs Server Action Form HOC
 *
 * sobird<i@sobird.me> at 2023/12/28 0:20:20 created.
 */

'use client';

import React, { useEffect } from 'react';
import {
  Form, FormProps, FormInstance, message,
} from 'antd';
import Submitter, { type SubmitterProps } from '@/components/submitter';
import useServerAction from '@/hooks/useServerAction';

export interface ActionFormProps extends Omit<FormProps, 'action'> {
  action?: FormServerAction;
  submitter?: SubmitterProps<{ form?: FormInstance<any>; }> | false;
  /** async server action finish */
  onFinish?: (state: ServerActionState) => void;
  /** async server action failed */
  onFailed?: (state: ServerActionState) => void;
}

const ActionForm: React.FC<ActionFormProps> = ({
  action,
  children,
  layout = 'vertical',
  wrapperCol,
  submitter,
  onFinish,
  onFailed,
  ...props
}) => {
  const [state, dispatch, pending] = useServerAction(action);
  console.log('state', state);
  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.success) {
      console.log('onFinish', onFinish);
      onFinish?.(state);
    } else {
      onFailed?.(state);
      // 提交失败显示失败信息
      message.error(state.message);
    }
  }, [state]);

  let { labelCol } = props;

  // 垂直布局
  if (layout === 'vertical') {
    labelCol = undefined;
  }
  return (
    <Form
      layout={layout}
      onFinish={dispatch}
      labelCol={labelCol}
      wrapperCol={wrapperCol}
      {...props}
    >
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

export default ActionForm;

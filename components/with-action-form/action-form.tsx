/**
 * Nextjs Server Action Form HOC
 *
 * sobird<i@sobird.me> at 2023/12/28 0:20:20 created.
 */

'use client';

import React from 'react';
import {
  Form, FormProps, FormInstance, message,
} from 'antd';
import Submitter, { type SubmitterProps } from '@/components/submitter';
import { useServerAction, useUpdate } from '@/hooks';
import { ActionStatus } from '@/actions';

export interface ActionFormProps extends Omit<FormProps, 'action'> {
  action: FormServerAction;
  submitter?: SubmitterProps<{ form?: FormInstance<any>; }> | false;
  /**
   * async server action finish
   *
   * 如果 server action 中使用 redirect 函数 将不会触发，因为成功后会跳转页面，执行不了后面的回调函数
   *
   * @param state
   * @returns
   */
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
  const initialState = {
    status: ActionStatus.INITIAL,
    message: 'initial',
  };
  const [state, dispatch, pending] = useServerAction(action, initialState);

  useUpdate(() => {
    if (state?.status === ActionStatus.INITIAL) {
      return;
    }
    if (state && state.status === ActionStatus.FAILURE) {
      // 失败显示失败信息
      message.error(state?.message);
      return onFailed?.(state);
    }
    return onFinish?.(state);
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

/**
 * ActionActionFormModal
 *
 * sobird<i@sobird.me> at 2023/12/29 1:21:20 created.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Button, Modal, ModalProps } from 'antd';
import { ActionFormProps } from '../with-action-form/action-form';

export interface ActionFormModalProps extends ModalProps {
  trigger?: JSX.Element | false;
  children?: JSX.Element;
  ActionForm: React.FC<ActionFormProps>;
  actionFormProps?: ActionFormProps;
}

const ActionFormModal: React.FC<ActionFormModalProps> = ({
  children,
  trigger,
  ActionForm,
  actionFormProps,
  ...props
}) => {
  const [open, setOpen] = useState(false);
  const showModal = () => {
    setOpen(true);
  };

  const handleOk = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // console.log('slot', actionForm);
  console.log('children', children);

  const triggerDom = useMemo(() => {
    if (!trigger) {
      return null;
    }

    if (typeof trigger === 'string') {
      return <Button type="primary" onClick={showModal}>{trigger}</Button>;
    }

    return React.cloneElement(trigger, {
      key: 'trigger',
      ...trigger.props,
      onClick: async (e: any) => {
        setOpen(!open);
        trigger.props?.onClick?.(e);
      },
    });
  }, [setOpen, trigger]);

  return (
    <>
      {triggerDom}
      <Modal open={open} onOk={handleOk} onCancel={handleCancel} footer={false} {...props}>
        <ActionForm {...actionFormProps} onFinish={handleOk} />
      </Modal>
    </>
  );
};

export default ActionFormModal;

/**
 * ActionActionFormModal
 *
 * sobird<i@sobird.me> at 2023/12/29 1:21:20 created.
 */

'use client';

import React, { useState, useMemo, PropsWithChildren } from 'react';
import { Button, Modal, ModalProps } from 'antd';

export interface ActionFormModalProps extends ModalProps {
  trigger?: React.ReactNode | false;
  children: JSX.Element;
}

const ActionFormModal: React.FC<ActionFormModalProps> = ({
  children,
  trigger,
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

  const childrenDom = React.cloneElement(children, {
    ...children.props,
    onFinish: async (state) => {
      setOpen(false);
    },
  });

  return (
    <>
      {triggerDom}
      <Modal open={open} onOk={handleOk} onCancel={handleCancel} footer={false} {...props}>
        {childrenDom}
      </Modal>
    </>
  );
};

export default ActionFormModal;

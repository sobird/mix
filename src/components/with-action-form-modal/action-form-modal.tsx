/**
 * Action Form Modal
 *
 * sobird<i@sobird.me> at 2023/12/29 1:21:20 created.
 */

'use client';

import { Button, Modal, ModalProps } from 'antd';
import React, { useState, useMemo } from 'react';

export interface ActionFormModalProps extends ModalProps {
  trigger?: JSX.Element | string;
  children?: JSX.Element;
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

  const childrenDom = useMemo(() => {
    if (!children) {
      return null;
    }

    return React.cloneElement(children, {
      ...children.props,
      onFinish: () => {
        setOpen(false);
      },
    });
  }, [setOpen, children]);

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

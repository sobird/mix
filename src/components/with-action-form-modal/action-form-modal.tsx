/**
 * Action Form Modal
 *
 * sobird<i@sobird.me> at 2023/12/29 1:21:20 created.
 */

'use client';

import { Button, Modal, ModalProps } from 'antd';
import React, { useState, useMemo } from 'react';

export interface ActionFormModalProps extends ModalProps {
  trigger?: React.JSX.Element | string;
  children?: React.JSX.Element;
}

const ActionFormModal: React.FC<ActionFormModalProps> = ({ children, trigger, ...props }) => {
  const [open, setOpen] = useState(false);

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
      return (
        <Button
          type="primary"
          onClick={() => {
            return setOpen(true);
          }}
        >
          {trigger}
        </Button>
      );
    }

    return React.cloneElement(trigger, {
      key: 'trigger',
      ...trigger.props,
      onClick: async (e: any) => {
        setOpen((prev) => {
          return !prev;
        });
        trigger.props?.onClick?.(e);
      },
    });
  }, [trigger]);

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
  }, [children]);

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

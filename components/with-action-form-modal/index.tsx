/**
 * Nextjs Server Action Form Modal HOC
 *
 * @package server && client
 *
 * sobird<i@sobird.me> at 2023/12/29 0:04:28 created.
 */

import React from 'react';

import { ActionFormProps } from '@/components/with-action-form/action-form';

import ActionFormModal, { ActionFormModalProps } from './action-form-modal';

const withActionFormModal = (
  ActionForm: React.FC<ActionFormProps>,
  actionFormModalProps: ActionFormModalProps,
) => {
  return ({ children, ...actionFormProps }: ActionFormProps) => {
    return (
      <ActionFormModal
        trigger={children as JSX.Element}
        {...actionFormModalProps}
      >
        <ActionForm {...actionFormProps} />
      </ActionFormModal>
    );
  };
};

export default withActionFormModal;

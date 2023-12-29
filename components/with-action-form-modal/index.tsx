/**
 * Nextjs Server Action Form Modal HOC
 *
 * @package server && client
 *
 * sobird<i@sobird.me> at 2023/12/29 0:04:28 created.
 */

import React from 'react';
import ActionFormModal, { ActionFormModalProps } from './action-form-modal';
import { ActionFormProps } from '@/components/with-action-form/action-form';

const withActionFormModal = (
  actionFormModalProps: ActionFormModalProps,
) => {
  return ({ children, ...actionFormProps }: ActionFormProps) => {
    console.log('children', children);
    return (
      <ActionFormModal
        actionFormProps={actionFormProps}
        trigger={<div>ddd</div>}
        {...actionFormModalProps}
      />
    );
  };
};

export default withActionFormModal;

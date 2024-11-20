/**
 * Nextjs Server Action Form HOC
 *
 * @package server && client
 *
 * sobird<i@sobird.me> at 2023/12/29 2:45:29 created.
 */

import React from 'react';

import ActionForm, { ActionFormProps } from './action-form';

const withActionForm = (Slot: any) => {
  return (actionFormProps: ActionFormProps) => {
    const { children, mode = 'create', data } = actionFormProps;
    return (
      <ActionForm {...actionFormProps}>
        <Slot mode={mode} data={data}>{children}</Slot>
      </ActionForm>
    );
  };
};

export default withActionForm;

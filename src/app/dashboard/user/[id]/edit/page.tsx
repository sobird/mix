/**
 * 编辑角色页面
 *
 * sobird<i@sobird.me> at 2023/12/08 22:40:59 created.
 */

import { notFound } from 'next/navigation';
import React from 'react';

import { updateUserAction } from '@/actions/user';
import UserForm from '@/app/dashboard/user/components/user-form';
import { getCurrentAbility } from '@/services/ability';
import { NotFoundError } from '@/services/errors';
import { UserService } from '@/services/user';

interface UserEditPageParams {
  id: string;
}

const UserEditPage: AppPage<UserEditPageParams> = async ({ params }) => {
  const { id } = await params;

  const ability = await getCurrentAbility();

  let initialValues;
  try {
    initialValues = await UserService.findForEdit(ability, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }

  return <UserForm action={updateUserAction} initialValues={initialValues} mode="edit" />;
};

export default UserEditPage;

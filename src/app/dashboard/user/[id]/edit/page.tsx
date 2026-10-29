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
import { ForbiddenError, NotFoundError } from '@/services/errors';
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
    // 不存在与无权访问统一按 404 处理，避免暴露记录是否存在
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      notFound();
    }

    throw error;
  }

  return <UserForm action={updateUserAction} initialValues={initialValues} mode="edit" />;
};

export default UserEditPage;

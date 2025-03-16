/**
 * 编辑角色页面
 *
 * sobird<i@sobird.me> at 2023/12/08 22:40:59 created.
 */

import { notFound } from 'next/navigation';
import React from 'react';

import { updateUserAction } from '@/actions/user';
import UserForm from '@/app/dashboard/user/components/user-form';
import { UserModel, RoleModel } from '@/models';

interface UserEditPageParams {
  id: string;
}

const UserEditPage: AppPage<UserEditPageParams> = async ({ params }) => {
  const { id } = await params;

  const user = await UserModel.findOne({
    where: {
      id,
    },
    attributes: {
      exclude: ['password'],
    },
    include: [{
      model: RoleModel,
      attributes: ['id'],
    }],
  });

  if (!user) {
    notFound();
  }

  const { Roles, ...initialValues } = user.toJSON();
  (initialValues as any).roles = Roles?.map((item) => { return item.id; });

  return (
    <UserForm action={updateUserAction} initialValues={initialValues} mode="edit" />
  );
};

export default UserEditPage;

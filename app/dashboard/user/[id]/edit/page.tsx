/**
 * 编辑角色页面
 *
 * sobird<i@sobird.me> at 2023/12/08 22:40:59 created.
 */

import { NextPage } from 'next';
import React from 'react';
import UserForm from '@/app/dashboard/user/components/user-form';
import { updateUserAction } from '@/actions/user';
import { UserModel, RoleModel } from '@/models';

interface UserEditPageProps {
  params: {
    id: string;
  };
}

const UserEditPage: NextPage<UserEditPageProps> = async ({ params }) => {
  const { id } = params;

  const user = await UserModel.findOne({
    where: {
      id,
    },
    attributes: {
      exclude: ['password'],
    },
    include: [{
      model: RoleModel,
    }],
  });

  console.log('user', user?.get());

  return (
    <UserForm action={updateUserAction} initialValues={user?.get()} mode="update" />
  );
};

export default UserEditPage;

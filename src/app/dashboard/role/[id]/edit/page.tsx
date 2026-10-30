/**
 * 编辑角色页面
 *
 * sobird<i@sobird.me> at 2023/12/08 22:40:59 created.
 */

import { notFound } from 'next/navigation';

import { updateRoleAction } from '@/actions/role';
import { getCurrentAbility } from '@/services/ability';
import { ForbiddenError, NotFoundError } from '@/services/errors';
import RoleService from '@/services/role';

import RoleForm from '../../components/role-form';

const Page = async ({ params }: PageProps<'/dashboard/role/[id]/edit'>) => {
  const { id } = await params;

  const ability = await getCurrentAbility();

  let role;
  try {
    role = await RoleService.findForEdit(ability, id);
  } catch (error) {
    // 不存在与无权访问统一按 404 处理，避免暴露记录是否存在
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      notFound();
    }

    throw error;
  }

  return <RoleForm action={updateRoleAction} initialValues={role} />;
};

export default Page;

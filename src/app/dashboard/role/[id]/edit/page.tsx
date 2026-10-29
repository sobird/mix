/**
 * 编辑角色页面
 *
 * sobird<i@sobird.me> at 2023/12/08 22:40:59 created.
 */

import { updateRoleAction } from '@/actions/role';
import { getCurrentAbility } from '@/services/ability';
import RoleService from '@/services/role';

import RoleForm from '../../components/role-form';

interface Params {
  id: string;
}

const Page: AppPage<Params> = async ({ params }) => {
  const { id } = await params;

  const ability = await getCurrentAbility();
  const role = await RoleService.findForEdit(ability, id);

  return <RoleForm action={updateRoleAction} initialValues={role.get()} />;
};

export default Page;

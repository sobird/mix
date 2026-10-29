import { getCurrentAbility } from '@/services/ability';
import RoleService from '@/services/role';

import InternalUserForm from './form';

const UserForm: React.FC<React.ComponentProps<typeof InternalUserForm>> = async (props) => {
  const ability = await getCurrentAbility();
  const roleOptions = await RoleService.listOptions(ability);
  return (
    <InternalUserForm
      {...props}
      data={{
        roleOptions,
      }}
    />
  );
};

export default UserForm;

import type { ActionFormProps } from '@/components/with-action-form/action-form';
import { getCurrentAbility } from '@/services/ability';
import RoleService from '@/services/role';

import InternalUserForm from './form';

const UserForm: React.FC<ActionFormProps> = async (props) => {
  const ability = await getCurrentAbility();
  const roleOptions = await RoleService.listOptions(ability);
  const allowedFields = props.initialValues ? Object.keys(props.initialValues) : undefined;

  return (
    <InternalUserForm
      {...props}
      data={{
        ...props.data,
        roleOptions,
        allowedFields,
      }}
    />
  );
};

export default UserForm;

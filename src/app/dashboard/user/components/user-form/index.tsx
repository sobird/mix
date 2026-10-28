import { RoleModel } from '@/models';

import InternalUserForm from './form';

const UserForm: React.FC<React.ComponentProps<typeof InternalUserForm>> = async (props) => {
  const roleOptions = await RoleModel.findAll({
    raw: true,
    attributes: [['id', 'value'], ['name', 'label']],
  });
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

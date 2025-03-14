import Role from '@/models/role';

import Ddd from './checkboxGroup';
import { PermissionForm } from './form';
import PermissionEditor from './form2';

const { permission } = Role;

console.log('permission', permission);

export default function Page() {
  return (
    <div>
      <Ddd />
      <PermissionForm />
      <PermissionEditor />
    </div>
  );
}

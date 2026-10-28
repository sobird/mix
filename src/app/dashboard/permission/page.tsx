import { Role } from '@/models/Role';

import { PermissionForm } from './form';
import PermissionEditor from './form2';

const { permission } = Role;

console.log('permission', permission);

export default function Page() {
  return (
    <div>
      <PermissionForm />
      <PermissionEditor />
    </div>
  );
}

import { syncPermissionCatalog } from '@/services/permission-catalog';
import RoleService from '@/services/role';

const catalog = await syncPermissionCatalog();
console.log(`catalog permissions created: ${catalog.permissions}`);
console.log(`builtin grants: ${catalog.grants}`);

const ownerId = await RoleService.assignOwnerToFirstUser();
console.log(ownerId === null ? 'owner: none (database empty or already assigned)' : `owner: user ${ownerId}`);

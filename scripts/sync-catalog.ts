import { syncMenuCatalog } from '@/services/menu-catalog';
import { syncPermissionCatalog } from '@/services/permission-catalog';
import RoleService from '@/services/role';

const catalog = await syncPermissionCatalog();
console.log(`catalog permissions created: ${catalog.permissions}`);
console.log(`builtin grants: ${catalog.grants}`);

const menuCatalog = await syncMenuCatalog();
console.log(`catalog menus created: ${menuCatalog.menus}`);

const ownerId = await RoleService.assignOwnerToFirstUser();
console.log(ownerId === null ? 'owner: none (database empty or already assigned)' : `owner: user ${ownerId}`);

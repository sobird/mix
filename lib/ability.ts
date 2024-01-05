/**
 * 系统预设权限规则
 *
 * @see https://casl.js.org/v6/en/cookbook/roles-with-static-permissions
 * sobird<i@sobird.me> at 2023/12/26 18:58:45 created.
 */

import {
  createMongoAbility, ForcedSubject, AbilityBuilder, MongoAbility, CreateAbility, InferSubjects,
} from '@casl/ability';
import Models, { UserAttributes } from '@/models';

type Subjects = InferSubjects<keyof typeof Models | 'all'>;
type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';

type AppAbilities = [
  Actions,
  Subjects | ForcedSubject<Exclude<Subjects, 'all'>>,
];

export type AppAbility = MongoAbility<AppAbilities>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

type DefinePermissions = (user: UserAttributes, builder: AbilityBuilder<AppAbility>) => void;
type Roles = 'visitor' | 'member' | 'manage';

/** 系统预设角色权限规则 */
const rolePermissions: Record<Roles, DefinePermissions> = {
  // 登录用户默认角色
  member(user, { can }) {
    can('update', 'Role', { id: user.id });
  },
  manage(user, { can }) {
    can('manage', 'all', { id: user.id });
  },
  // 未登录用户 访客
  visitor(user, { can }) {
    //
  },
};

/**
 * @param user contains details about logged in user: its id, name, email, role, etc
 */
export function defineAbilityFor(user) {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);

  console.log('user', user);

  if (typeof rolePermissions[user?.role] === 'function') {
    rolePermissions[user.role](user, builder);
  } else {
    // throw new Error(`Trying to use unknown role "${user?.role}"`);
  }

  return builder.build();
}

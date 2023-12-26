/**
 * 系统预设权限规则
 *
 * @see https://casl.js.org/v6/en/cookbook/roles-with-static-permissions
 * sobird<i@sobird.me> at 2023/12/26 18:58:45 created.
 */

import {
  createMongoAbility, ForcedSubject, AbilityBuilder, MongoAbility, CreateAbility,
} from '@casl/ability';
import Models from '@/models';

type Subjects = keyof typeof Models | 'all';
type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'invite';

type AppAbilities = [
  Actions,
  Subjects | ForcedSubject<Exclude<Subjects, 'all'>>,
];

export type AppAbility = MongoAbility<AppAbilities>;
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>;

type DefinePermissions = (user: User, builder: AbilityBuilder<AppAbility>) => void;
type Roles = 'member' | 'admin';

const rolePermissions: Record<Roles, DefinePermissions> = {
  member(user, { can }) {
    can('invite', 'User');
    can('update', 'User', { id: user.id });
  },
  admin(user, { can }) {
    can('manage', 'all', { id: user.id });
  },
};

/**
 * @param user contains details about logged in user: its id, name, email, role, etc
 */
export function defineAbilitiesFor(user: User) {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (typeof rolePermissions[user.role] === 'function') {
    rolePermissions[user.role](user, builder);
  } else {
    throw new Error(`Trying to use unknown role "${user.role}"`);
  }

  return builder.build();
}

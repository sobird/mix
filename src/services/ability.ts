/**
 * 系统预设权限规则
 *
 * manage and all are special keywords in CASL.
 * manage represents any action and all represents any subject.
 *
 * @see https://casl.js.org/v6/en/cookbook/roles-with-static-permissions
 * sobird<i@sobird.me> at 2023/12/26 18:58:45 created.
 */

import {
  createMongoAbility,
  ForcedSubject,
  AbilityBuilder,
  MongoAbility,
  CreateAbility,
  InferSubjects,
} from '@casl/ability';

import { toSequelizeQuery } from '@/lib/casl';
import Models, {
  UserModel, RoleModel, PermissionModel, UserAttributes,
} from '@/models';
import User from '@/models/user';

export type Subjects = InferSubjects<keyof typeof Models | 'all'>;
export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';

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

  if (typeof rolePermissions[user?.role] === 'function') {
    rolePermissions[user.role](user, builder);
  } else {
    // throw new Error(`Trying to use unknown role "${user?.role}"`);
  }

  return builder.build();
}

class AbilityService {
  /**
   * @param user contains details about logged in user: its id, name, email, role, etc
   */
  static async createFor(user: User) {
    const {
      can, cannot, rules, build,
    } = new AbilityBuilder(createMongoAbility);

    // 获取用户所有角色及其权限
    const userWithRoles = await UserModel.findByPk(user.id, {
      include: [{
        model: RoleModel,
        include: [PermissionModel],
      }],
    });

    let permissions: PermissionModel[] = [];
    if (userWithRoles) {
      permissions = userWithRoles.Roles
        .flatMap((role) => { return role.Permissions; })
        .filter((p, index, arr) => {
          return arr.findIndex((per) => {
            return per.action === p.action && per.subject === p.subject;
          }) === index;
        });
    }

    permissions.forEach((permission) => {
      can(permission.action, permission.subject);
    });

    return createMongoAbility(rules);
  }

  static accessibleBy(ability: AppAbility, action: Actions, model: Subjects) {
    return { where: toSequelizeQuery(ability, action, model) };
  }
}
export default AbilityService;

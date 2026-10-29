import { Op, type Attributes } from 'sequelize';

import { Role, User } from '@/models';
import { isAllowed, type AppAbility } from '@/services/ability';

import { paginateAccessible, type PageQuery } from './access';
import { ForbiddenError, NotFoundError } from './errors';
import RoleService from './role';

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  nickname?: string | null;
  realname?: string | null;
  mobile?: string;
  gender?: 'male' | 'female' | 'unknown' | '';
  status?: boolean;
  roles?: number[];
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  nickname?: string | null;
  realname?: string | null;
  mobile?: string;
  gender?: 'male' | 'female' | 'unknown' | '';
  status?: boolean;
  roles?: number[];
}

export type UserEditData = Attributes<User> & { roles: number[] };

/**
 * 用户服务：所有读写都先经过能力检查。
 *
 * 列表按 `read` 过滤；写操作在加载目标实例后按 `update` / `delete` 精确判断，
 * 读取密码以外的字段，密码只在创建时写入。
 */
// oxlint-disable-next-line typescript/no-extraneous-class
export class UserService {
  static async listWithPage(ability: AppAbility, query: PageQuery) {
    return paginateAccessible(User, ability, 'read', query, { exclude: ['password'] });
  }

  /** 读取可编辑用户：不含密码，角色以 id 数组返回 */
  static async findForEdit(ability: AppAbility, id: number | string): Promise<UserEditData> {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, attributes: ['id'] }],
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    if (!isAllowed(ability, 'update', 'User', user)) {
      throw new ForbiddenError('您没有更新用户的权限');
    }

    const { Roles, ...rest } = user.toJSON() as Attributes<User> & { Roles?: { id: number }[] };

    return { ...rest, roles: Roles?.map((role) => role.id) ?? [] };
  }

  static async create(ability: AppAbility, data: UserCreateInput): Promise<[User, boolean]> {
    if (!isAllowed(ability, 'create', 'User')) {
      throw new ForbiddenError('您没有创建用户的权限');
    }

    const { roles, confirmPassword: _confirmPassword, ...attributes } = data;

    const [user, created] = await User.findOrCreate({
      defaults: {
        ...attributes,
        emailVerified: new Date(),
      },
      where: {
        [Op.or]: [{ username: attributes.username }, { email: attributes.email }],
      },
    });

    if (created) {
      if (roles?.length) {
        await user.setRoles(roles);
      } else {
        await RoleService.assignDefaultRole(user.id);
      }
    }

    return [user, created];
  }

  static async update(ability: AppAbility, id: number | string, data: UserUpdateInput): Promise<void> {
    const user = await User.findByPk(id);

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    if (!isAllowed(ability, 'update', 'User', user)) {
      throw new ForbiddenError('您没有更新用户的权限');
    }

    const { roles, password: _password, confirmPassword: _confirmPassword, ...attributes } = data;
    await user.update(attributes);

    if (roles?.length) {
      await user.setRoles(roles);
    }
  }

  static async remove(ability: AppAbility, id: number | string): Promise<void> {
    const user = await User.findByPk(id);

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    if (!isAllowed(ability, 'delete', 'User', user)) {
      throw new ForbiddenError('您没有删除用户的权限');
    }

    await user.destroy();
  }
}

export default UserService;

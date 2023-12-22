/**
 * Extends NextAuth AdapterUser Model
 *
 * A user represents a person who can sign in to the application.
 * If a user does not exist yet, it will be created when they sign in for the first time,
 * using the information (profile data) returned by the identity provider.
 * A corresponding account is also created and linked to the user.
 *
 * @see https://sequelize.org/docs/v7/associations/belongs-to-many
 *
 * sobird<i@sobird.me> at 2021/11/16 20:30:51 created.
 */

import { randomBytes, createHmac } from 'crypto';
import {
  DataTypes, Op,
  InferAttributes, InferCreationAttributes, CreationOptional,
  BelongsToManyGetAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyAddAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManyHasAssociationMixin,
  BelongsToManyHasAssociationsMixin,
  BelongsToManyCreateAssociationMixin,
  BelongsToManyCountAssociationsMixin,
} from 'sequelize';
import { sequelize, BaseModel } from '@/lib/sequelize';
import type Role from './role';

/** 隐私属性字段排除 */
export const UserExcludeAttributes = ['salt', 'password', 'emailVerified'];

// These are all the attributes in the User model
export type UserAttributes = InferAttributes<User>;

// Some attributes are optional in `User.build` and `User.create` calls
export type UserCreationAttributes = InferCreationAttributes<User>;
// 用户登录属性
export type UserSigninAttributes = Pick<UserAttributes, 'username' | 'password'>;
// 用户注册属性
export type UserSignupAttributes = Pick<UserAttributes, 'username' | 'password' | 'email'>;

class User extends BaseModel<UserAttributes, UserCreationAttributes> {
  declare username: CreationOptional<string>;

  declare name: CreationOptional<string | null>;

  declare nickname: CreationOptional<string>;

  declare realname: CreationOptional<string>;

  declare salt: CreationOptional<string>;

  public password!: CreationOptional<string>;

  declare email: string;

  declare emailVerified: CreationOptional<Date | null>;

  public ip: CreationOptional<string>;

  declare getRoles: BelongsToManyGetAssociationsMixin<Role>;

  /** Remove all previous associations and set the new ones */
  declare setRoles: BelongsToManySetAssociationsMixin<Role, Role['id']>;

  declare addRole: BelongsToManyAddAssociationMixin<Role, Role['id']>;

  declare addRoles: BelongsToManyAddAssociationsMixin<Role, Role['id']>;

  declare removeRole: BelongsToManyRemoveAssociationMixin<Role, Role['id']>;

  declare removeRoles: BelongsToManyRemoveAssociationsMixin<Role, Role['id']>;

  declare hasRole: BelongsToManyHasAssociationMixin<Role, Role['id']>;

  declare hasRoles: BelongsToManyHasAssociationsMixin<Role, Role['id']>;

  declare createRole: BelongsToManyCreateAssociationMixin<Role>;

  declare countRoles: BelongsToManyCountAssociationsMixin;

  /**
   * associate
   *
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   *
   * The `models/index` file will call this method automatically.
   */
  static associate({ Role, UserRole }) {
    // todo
    this.belongsToMany(Role, { through: UserRole });
  }

  /** 用户注册 */
  public static async signup(attributes: UserSignupAttributes) {
    const [user, created] = await this.findOrCreate({
      defaults: {
        ...attributes,
        emailVerified: new Date(),
      },
      fields: ['username', 'password', 'email', 'emailVerified', 'salt'],
      where: {
        [Op.or]: [
          { username: attributes.username },
          { email: attributes.email },
        ],
      },
      raw: true,
    });
    return [user, created];
  }

  /** 通过用户名和密码进行用户登录认证 */
  public static async signin({ username, password }: UserSigninAttributes) {
    if (!username || !password) {
      return Promise.reject('用户名和密码不能为空');
    }

    const user = await this.findOne({
      where: { username },
      // attributes: ['username', 'email', 'password', 'salt'],
    });

    if (!user) {
      return Promise.reject('用户不存在');
    }

    if (user.verifyPassword(password)) {
      return user.get({ plain: true });
    }
    return Promise.reject('密码不正确');
  }

  /**
   * 通过安全散列算法生成一个64位长度的hash串
   *
   * @param password 原始密码
   * @param salt 盐
   * @return 返回一个64位长度的Hash字符串
   */
  public static hashPassword(password: string, salt: string): string {
    return createHmac('sha256', salt).update(password).digest('hex');
  }

  /**
   * 校验用名&密码
   *
   * @param password
   */
  public verifyPassword(password: string) {
    return User.hashPassword(password, this.salt) === this.password;
  }
}

User.init(
  {
    username: {
      type: DataTypes.STRING(32),
      unique: true,
      comment: 'user name',
    },
    name: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.username;
      },
      set(value: string) {
        this.setDataValue('username', value);
      },
    },
    nickname: {
      type: DataTypes.STRING(32),
      comment: 'nick name',
    },
    realname: {
      type: DataTypes.STRING(32),
      comment: 'real name',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'user email',
    },
    emailVerified: {
      type: DataTypes.DATE,
      comment: 'email verified',
    },
    password: {
      type: DataTypes.STRING(128),
      comment: 'user password hash',
    },
    salt: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: randomBytes(16).toString('hex'),
      comment: 'user salt',
    },
    ip: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'user last login ip',
    },
  },
  {
    sequelize,
  },
);

User.beforeCreate((model) => {
  if (model.password) {
    model.password = User.hashPassword(model.password, model.salt);
  }
  // model.ip = fn("INET_ATON", model.ip); // INET_NTOA
});

export default User;

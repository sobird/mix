/**
 * Extends NextAuth AdapterUser Model
 *
 * A user represents a person who can sign in to the application.
 * If a user does not exist yet, it will be created when they sign in for the first time,
 * using the information (profile data) returned by the identity provider.
 * A corresponding account is also created and linked to the user.
 *
 * sobird<i@sobird.me> at 2021/11/16 20:30:51 created.
 */

import { randomBytes, createHmac } from 'crypto';
import {
  DataTypes, Model, Optional,
} from 'sequelize';
import sequelize from '@/lib/sequelize';

// These are all the attributes in the User model
export interface UserAttributes {
  id?: number;
  username: string;
  nickname?: string | null;
  realname?: string | null;
  /**
   * The user's email address.
   */
  email: string;
  /**
   * Whether the user has verified their email address via an Email provider.
   * It is null if the user has not signed in with the Email provider yet,
   * or the date of the first successful signin.
   */
  emailVerified: null | Date;
  password: string;
  salt: string;
  ip: string;
}
// Some attributes are optional in `User.build` and `User.create` calls
export type UserCreationAttributes = Optional<UserAttributes, 'id' | 'nickname' | 'realname' | 'salt' | 'ip'>;
// 用户登录属性
export type UserSigninAttributes = Pick<UserAttributes, 'username' | 'password'>;
// 用户注册属性
export type UserSignupAttributes = Pick<UserAttributes, 'username' | 'password' | 'email'>;

class User extends Model<UserAttributes, UserCreationAttributes> {
  declare id: number;

  public username!: string;

  public salt!: string;

  public password!: string;

  public email!: string;

  private createdAt: string;

  public ip: string;

  /** 用户注册 */
  public static async signup(attributes: UserSignupAttributes) {
    const [user, created] = await this.findOrCreate({
      defaults: attributes,
      where: {
        username: attributes.username,
      },
    });
    return [user, created];
  }

  /** 通过用户名和密码进行用户登录认证 */
  public static async signin({ username, password }: UserSigninAttributes) {
    if (!username || !password) {
      return Promise.reject('username or password cannot be empty!');
    }

    const user = await this.findOne({
      where: { username },
    });

    if (!user) {
      return Promise.reject('user not found!');
    }

    if (user.verifyPassword(password)) {
      return user;
    }
    return Promise.reject('username or password not correct');
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
      allowNull: false,
      comment: 'user name',
    },
    nickname: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: 'nick name',
    },
    realname: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: 'real name',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'user email',
    },
    password: {
      type: DataTypes.STRING(128),
      allowNull: false,
      comment: 'user password hash',
    },
    salt: {
      type: DataTypes.STRING(128),
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
    modelName: 'user',
  },
);

User.beforeCreate((model) => {
  model.password = User.hashPassword(model.password, model.salt);
  // model.ip = fn("INET_ATON", model.ip); // INET_NTOA
});

export default User;

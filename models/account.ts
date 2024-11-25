/**
 * NextAuth AdapterAccount
 *
 * An account is a connection between a user and a provider.
 * There are two types of accounts:
 * OAuth/OIDC accounts, which are created when a user signs in with an OAuth provider.
 * Email accounts, which are created when a user signs in with an Email provider.
 *
 * One user can have multiple accounts.
 *
 * sobird<i@sobird.me> at 2023/11/29 10:37:29 created.
 */

import {
  DataTypes,
  type InferAttributes, InferCreationAttributes, CreationOptional,
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

import type { AdapterAccountType } from '@auth/core/adapters';

/** These are all the attributes in the Account model */
export type AccountAttributes = InferAttributes<Account>;
/** Some attributes are optional in `Account.build` and `Account.create` calls */
export type AccountCreationAttributes = InferCreationAttributes<Account>;

class Account extends BaseModel<AccountAttributes, AccountCreationAttributes> {
  declare id: CreationOptional<number>;

  declare userId: string;

  declare type: AdapterAccountType;

  /**
   * Provider's id for this account. Eg.: 'google'
   */
  declare provider: string;

  /**
   * This value depends on the type of the provider being used to create the account.
   *
   * oauth/oidc: The OAuth account's id, returned from the profile() callback.
   * email: The user's email address.
   * credentials: id returned from the authorize() callback
   */
  declare providerAccountId: string;

  declare refresh_token?: string;

  declare access_token?: string | undefined;

  /**
   * Calculated value based on [OAuth2TokenEndpointResponse.expires_in]([object Object]).
   * It is the absolute timestamp (in seconds) when the [OAuth2TokenEndpointResponse.access_token]([object Object]) expires.
   * This value can be used for implementing token rotation together with [OAuth2TokenEndpointResponse.refresh_token]([object Object]).
   */
  declare expires_at?: number;

  declare token_type?: 'bearer' | 'dpop' | Lowercase<string>;

  declare scope?: string;

  declare id_token?: string;

  declare session_state: CreationOptional<string>;

  static associate({ User }) {
    this.belongsTo(User, { onDelete: 'cascade' });
  }
}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER(),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'account type',
    },
    provider: {
      type: DataTypes.STRING,
      // primaryKey: true,
      comment: 'account provider',
    },
    providerAccountId: {
      type: DataTypes.STRING,
      // primaryKey: true,
      comment: 'account providerAccountId',
    },
    refresh_token: {
      type: DataTypes.STRING,
      comment: 'refresh token',
    },
    access_token: {
      type: DataTypes.STRING,
      comment: 'access token',
    },
    expires_at: {
      type: DataTypes.INTEGER,
      comment: 'expires at',
    },
    token_type: {
      type: DataTypes.STRING,
      comment: 'token type',
    },
    scope: {
      type: DataTypes.STRING,
      comment: 'scope',
    },
    id_token: {
      type: DataTypes.TEXT,
      comment: 'id token',
    },
    session_state: {
      type: DataTypes.STRING,
      comment: 'session state',
    },
    userId: {
      type: DataTypes.INTEGER,
      comment: 'user id',
    },
  },
  {
    sequelize,
    modelName: 'Account',
  },
);

// Account.beforeCreate((model) => {

// });

export default Account;

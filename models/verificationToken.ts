/**
 * NextAuth AdapterVerificationToken
 *
 * A verification token is a temporary token that is used to sign in a user via their email address.
 * It is created when a user signs in with an Email provider.
 * When the user clicks the link in the email, the token and email is sent back to the server where it is hashed and compared to the value in the database.
 * If the tokens and emails match, and the token hasn't expired yet, the user is signed in.
 * The token is then deleted from the database.
 *
 * sobird<i@sobird.me> at 2023/11/29 10:37:29 created.
 */

import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

/** These are all the attributes in the VerificationToken model */
export type VerificationTokenAttributes = InferAttributes<VerificationToken>;

/** Some attributes are optional in `VerificationToken.build` and `VerificationToken.create` calls */
export type VerificationTokenCreationAttributes = InferCreationAttributes<VerificationToken>;

class VerificationToken extends BaseModel<VerificationTokenAttributes, VerificationTokenCreationAttributes> {
  /**
   * A hashed token, using the AuthConfig.secret value.
   */
  declare token: string;

  /**
   * The user's email address.
   */
  declare identifier: string;

  /**
   * The absolute date when the token expires.
   */
  declare expires: Date;
}

VerificationToken.init(
  {
    token: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'Verification Token',
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      comment: 'User id',
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Verification Token Expires',
    },
  },
  {
    sequelize,
    modelName: 'VerificationToken',
    paranoid: false,
  },
);

export default VerificationToken;

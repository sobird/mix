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
  type InferAttributes, InferCreationAttributes,
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
  token: string;

  /**
   * The user's email address.
   */
  identifier: string;

  /**
   * The absolute date when the token expires.
   */
  expires: Date;
}

VerificationToken.init(
  {
    token: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      comment: 'VerificationToken token',
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User id',
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'VerificationToken expires',
    },
  },
  {
    sequelize,
    modelName: 'VerificationToken',
  },
);

export default VerificationToken;

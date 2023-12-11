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

import { Model, DataTypes } from 'sequelize';
import sequelize from '@/lib/sequelize';

/** These are all the attributes in the VerificationToken model */
export interface VerificationTokenAttributes {
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
/** Some attributes are optional in `VerificationToken.build` and `VerificationToken.create` calls */
export type VerificationTokenCreationAttributes = VerificationTokenAttributes;

class VerificationToken extends Model<VerificationTokenAttributes, VerificationTokenCreationAttributes> {
  declare id: number;
}

VerificationToken.init(
  {
    token: {
      type: DataTypes.STRING,
      unique: true,
      comment: 'VerificationToken token',
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'user id',
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'VerificationToken expires',
    },
  },
  {
    sequelize,
    modelName: 'verificationToken',
  },
);

export default VerificationToken;

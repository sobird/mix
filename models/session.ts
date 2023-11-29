/**
 * NextAuth AdapterSession
 *
 * A session holds information about a user's current signin state.
 *
 * sobird<i@sobird.me> at 2023/11/29 10:37:29 created.
 */

import { Model, DataTypes, type Optional } from 'sequelize';
import type { AdapterSession } from '@auth/core/adapters';
import sequelize from '@/lib/sequelize';

/** These are all the attributes in the Session model */
export interface SessionAttributes extends AdapterSession {
  id?: number;
  /**
   * The absolute date when the session expires.
   *
   * If a session is accessed prior to its expiry date,
   * it will be extended based on the maxAge option as defined in by SessionOptions.maxAge.
   * It is never extended more than once in a period defined by SessionOptions.updateAge.
   *
   * If a session is accessed past its expiry date,
   * it will be removed from the database to clean up inactive sessions.
   */
  expires: Date;
  /**
   * A randomly generated value that is used to look up the session in the database when using "database" AuthConfig.strategy option.
   * This value is saved in a secure, HTTP-Only cookie on the client.
   */
  sessionToken: string;
  /**
   * Connects the active session to a user in the database
   */
  userId: string;
}
/** Some attributes are optional in `Session.build` and `Session.create` calls */
export type SessionCreationAttributes = Optional<SessionAttributes, 'id'>;

class Session extends Model<SessionAttributes, SessionCreationAttributes> {
  declare id: number;

  public userId!: number;
}

Session.init(
  {
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'session expires',
    },
    sessionToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'sessionToken',
      comment: 'session token',
    },
    userId: { type: DataTypes.UUID, comment: 'user id' },
  },
  {
    sequelize,
    modelName: 'session',
  },
);

export default Session;

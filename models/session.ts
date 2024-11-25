/**
 * NextAuth AdapterSession
 *
 * A session holds information about a user's current signin state.
 *
 * sobird<i@sobird.me> at 2023/11/29 10:37:29 created.
 */

import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type Association,
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

import type User from './user';

/** These are all the attributes in the Session model */
export type SessionAttributes = InferAttributes<Session>;
/** Some attributes are optional in `Session.build` and `Session.create` calls */
export type SessionCreationAttributes = InferCreationAttributes<Session>;

class Session extends BaseModel<SessionAttributes, SessionCreationAttributes> {
  declare id: CreationOptional<string>;

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

  static associate({ User }) {
    this.belongsTo(User, { onDelete: 'cascade' });
  }

  declare static associations: {
    Roles: Association<Session, User>;
  };
}

Session.init(
  {
    id: {
      type: DataTypes.INTEGER(),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Session Expires',
    },
    sessionToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'sessionToken',
      comment: 'Session Token',
    },
    userId: {
      type: DataTypes.INTEGER,
      comment: 'User Id',
    },
  },
  {
    sequelize,
    modelName: 'Session',
  },
);

export default Session;

/* eslint-disable max-classes-per-file */
import { Model, ModelStatic, Optional } from 'sequelize';

type NonConstructorKeys<T> = ({ [P in keyof T]: T[P] extends new () => any ? never : P })[keyof T];
type NonConstructor<T> = Pick<T, NonConstructorKeys<T>>;

class MyClass {
  constructor() {}

  prop1: string;

  static prop2: number;

  method() {}
}

type ClassKeys<T> = ({ [P in keyof T]: P })[keyof T];

type MyClassNonConstructor = ModelStatic<MyClass>;

interface UserAttributes {
  username: string;
}

interface UserCreationAttributes extends UserAttributes {}

export class User extends Model<UserAttributes, UserCreationAttributes> {
  static init(sequelize: Sequelize, DataTypes: typeof DataTypes) {
    super.init({
      username: DataTypes.STRING,
    }, {
      sequelize,
      tableName: 'users',
    });
  }
}

export type UserModelStatic = ModelStatic<User>;

export type DD = InstanceType<UserModelStatic>;

interface Parent {
  name: string;
  age: number;
  gender: string;
  desc?: string;
}

type Test = Optional<Parent, 'name'>;

const test:Test;

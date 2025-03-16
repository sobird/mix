/**
 * sequelize.ts
 *
 * Sequelize is an easy-to-use and promise-based Node.js ORM tool for
 * Postgres, MySQL, MariaDB, SQLite, DB2 and Microsoft SQL Server.
 * It features solid transaction support, relations, eager and lazy loading, read replication and more.
 *
 * @see https://javascript.plainenglish.io/why-you-should-be-cautious-with-sequelize-raw-options-5aaae9fc3ebd
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

import { AbilityTuple, MongoAbility, RawRule } from '@casl/ability';
import log4js from 'log4js';
import {
  Sequelize, Model, type ModelStatic, type Attributes, type CreationOptional,
} from 'sequelize';
import sqlite3 from 'sqlite3';

import { accessibleBy } from '@/lib/casl';
import type { Models } from '@/models';

const logger = log4js.getLogger('sequelize');
logger.level = log4js.levels.DEBUG;

/** 数据库链接实例 */
export const sequelize = new Sequelize({
  // The name of the database
  // database: 'mix',

  // The username which is used to authenticate against the database.
  // username: 'root',

  // The password which is used to authenticate against the database.
  // password: '12345678',

  // the sql dialect of the database
  // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
  dialect: 'sqlite',

  dialectModule: sqlite3,

  // custom host; default: localhost
  host: '127.0.0.1',
  // for postgres, you can also specify an absolute path to a directory
  // containing a UNIX socket to connect over
  // host: '/sockets/psql_sockets'.

  // custom port; default: dialect default
  // port: 3306,

  // custom protocol; default: 'tcp'
  // postgres only, useful for Heroku
  // protocol: null,

  // disable logging or provide a custom logging function; default: console.log
  // logging: false,

  // you can also pass any dialect options to the underlying dialect library
  // - default is empty
  // - currently supported: 'mysql', 'postgres', 'mssql'
  dialectOptions: {
    // 指定套接字文件路径
    // socketPath: '/var/lib/mysql/mysql.sock',
    supportBigNumbers: true,
    bigNumberStrings: true,
    // if your server run on full cpu load, please set trace to false
    trace: true,
  },

  // the storage engine for sqlite
  // - default ':memory:'
  storage: './database.sqlite',

  // disable inserting undefined values as NULL
  // - default: false
  omitNull: true,

  // a flag for using a native library or not.
  // in the case of 'pg' -- set this to true will allow SSL support
  // - default: false
  native: true,

  // Specify options, which are used when sequelize.define is called.
  // The following example:
  //   define: { timestamps: false }
  // is basically the same as:
  //   Model.init(attributes, { timestamps: false });
  //   sequelize.define(name, attributes, { timestamps: false });
  // so defining the timestamps for each model will be not necessary
  // timezone: '+08:00',
  define: {
    paranoid: true,

    underscored: true,
    // 强制表名称等于模型名称
    // freezeTableName: true,
    charset: 'utf8',
    // dialectOptions: {
    //   collate: 'utf8_general_ci'
    // },
    timestamps: true,

    // createdAt: 'createdAt',
    // updatedAt: 'updatedAt',
    // noPrimaryKey: true,
  },

  // similar for sync: you can define this to always force sync for models
  // sync: { force: true },

  // pool configuration used to pool database connections
  pool: {
    max: 5,
    idle: 30000,
    acquire: 60000,
  },

  // isolation level of each transaction
  // defaults to dialect default
  // isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ
  logging: (sql, queryObject: any) => {
    const { type, bind } = queryObject;
    logger.debug(type, sql);
    if (['INSERT', 'UPDATE', 'BULKUPDATE'].includes(type)) {
      logger.debug(bind);
    }
  },
});

// buildin permission
export interface PermissionTemplate {
  name: string;
  subject: string;

  rules: Omit<RawRule, 'subject'>[]

  // [key: string]: {
  //   description: string;
  //   roles: number[];
  //   rules?: Partial<RawRule>[];
  // }
}

/**
 * 模型基类
 *
 * sobird<i@sobird.me> at 2023/12/05 21:08:43 created.
 */
export abstract class BaseModel<T extends {} = any, P extends {} = T> extends Model<T, P> {
  declare id?: CreationOptional<number>;

  declare createdAt?: CreationOptional<Date>;

  declare updatedAt?: CreationOptional<Date>;

  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  public static associate: (models: Models) => void;

  declare static permission: PermissionTemplate;

  static accessibleBy = accessibleBy;

  public static async findManyWithAccessible<T extends AbilityTuple>(ability: MongoAbility<T>) {
    // todo
    console.log('ability', ability);
  }

  /** 分页查找模型数据 */
  public static async findManyByPage<M extends BaseModel>(
    this: ModelStatic<M>,
    query: PaginationSearchParams,
  ): Promise<{
      ps: number;
      pn: number;
      count: number;
      rows: Attributes<M>[]
    }> {
    const ps = Number(query.ps) || 20;
    const pn = Number(query.pn) || 1;
    const offset = (pn - 1) * ps;

    // const orderBy = query.orderBy || 'createdAt,DESC';
    // const order: string[] = [];
    // if (!Array.isArray(orderBy)) {
    //   order.push(orderBy);
    // }

    try {
      const { count, rows } = await this.findAndCountAll({
        offset,
        limit: ps,
        // order: order.map((item) => { return item.split(','); }) as Order,
        order: [['createdAt', 'DESC']],
      });
      return {
        pn, ps, count, rows: rows.map((el) => { return el.toJSON(); }),
      };
    } catch (err) {
      // console.log('err', err);
    }

    return {
      pn, ps, count: 0, rows: [],
    };
  }
}

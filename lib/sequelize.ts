/**
 * sequelize.ts
 *
 * Sequelize is an easy-to-use and promise-based Node.js ORM tool for
 * Postgres, MySQL, MariaDB, SQLite, DB2 and Microsoft SQL Server.
 * It features solid transaction support, relations, eager and lazy loading, read replication and more.
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

import { Sequelize } from 'sequelize';
import sqlite3 from 'sqlite3';

const sequelize = new Sequelize({
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
  logging: false,

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
  define: {
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
});

export default sequelize;

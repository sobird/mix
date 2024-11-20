// index.js
import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';

const sequelize = new Sequelize({ dialect: 'sqlite', storage: './db.sqlite' });

const umzug = new Umzug({
  migrations: { glob: 'migrations/*.js' },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Checks migrations and run them if they are not already applied. To keep
// track of the executed migrations, a table (and sequelize model) called SequelizeMeta
// will be automatically created (if it doesn't exist already) and parsed.
await umzug.up();

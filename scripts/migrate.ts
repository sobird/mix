import { runMigrations } from '@/lib/migrator';
import { sequelize } from '@/models';

runMigrations(sequelize)
  .then((ran) => {
    console.log(`migrations executed: ${ran.length}`);
    ran.forEach((name) => console.log(`- ${name}`));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

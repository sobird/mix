import { sequelize } from '@/models';

const installed = await sequelize.sync({ force: true });
console.log('installed models:', installed.models);

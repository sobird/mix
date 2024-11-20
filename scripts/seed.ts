import { sequelize } from '@/models';

const res = await sequelize.sync({ force: true });
console.log('install models:', res.models);

import { sequelize } from '@/models';

const res = await sequelize.sync({ alter: true });
console.log('install models:', res.models);

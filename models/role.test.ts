import { sequelize } from '@/models';

vi.mock('@/models');

const installed = await sequelize.sync({ force: true });
console.log('installed models:', installed.models);

const test = await sequelize.models.Role.findAll();
console.log('Role', test);

import User from '@/models/user';

vi.mock('@/models/user');

const rows = await User.findAll();
console.log('rows', rows);

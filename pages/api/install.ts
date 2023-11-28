import sequelize from '@/models';

sequelize.sync({ force: true }).then((res) => {
  console.log('res', res);
});

console.log('sequelize', sequelize.models);

export default (req, res) => {
  return res.json({ data: 123 });
};

import sequelize from '@/models';

export default (req, res) => {
  sequelize.sync({ force: true }).then((databaseRes) => {
    // console.log('res', res);
    res.json({ message: 'ok' });
  });
};

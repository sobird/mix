import sequelize from '@/models';

export default (req, res) => {
  sequelize.sync({ force: true }).then(() => {
    // console.log('res', res);
    res.json({ message: 'ok' });
  });
};

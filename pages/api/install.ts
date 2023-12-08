/**
 * @todo  生成环境要删除
 *
 * sobird<i@sobird.me> at 2023/11/28 20:51:07 created.
 */

import sequelize from '@/models';

export default (req, res) => {
  sequelize.sync({ force: true }).then(() => {
    // console.log('res', res);
    res.json({ message: 'ok' });
  });
};

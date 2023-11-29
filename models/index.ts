/**
 * models
 *
 * @see https://github.com/sequelize/sequelize/blob/main/types/test/typescriptDocs/ModelInit.ts
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

import { models } from '@auth/sequelize-adapter';
import sequelize from '@/lib/sequelize';
import User from './user';
import Account from './account';

// export const UserModel = User;
const defaultModelOptions = { underscored: false, timestamps: false };

const Session = sequelize.define('Session', {}, defaultModelOptions);
const VerificationToken = sequelize.define('VerificationToken', models.VerificationToken, defaultModelOptions);

Account.belongsTo(User, { onDelete: 'cascade' });
Session.belongsTo(User, { onDelete: 'cascade' });

export default sequelize;

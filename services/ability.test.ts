import { ForbiddenError, subject } from '@casl/ability';

import { UserModel } from '@/models';

// const rows = await UserModel.findAll({ include: [UserModel.associations.Roles] });
// console.log('rows', rows[0].Roles[0].get());

import AbilityService, { defineAbilityFor } from './ability';

vi.mock('@/models');

const ability = await AbilityService.createFor({ id: '1' });
console.log('ability', ability);

// export async function updateUserDetails(
//   /** email of a user who initiates the request (i.e., logged in user) */
//   id: string,
//   /** an email of user to be updated */
//   userToBeUpdatedId: string,
//   /** an object of changes to be applied */
//   changes: UserModel,
// ) {
//   const user = await UserModel.findByPk(id, { include: [UserModel.associations.Roles] });
//   const roles = user?.Roles!;

//   console.log('roles', roles[0].id);

//   const role = roles[0].id === 1 ? 'manage' : 'member';

//   // logged in user
//   const ability = defineAbilityFor({
//     id: user?.id,
//     role,
//   });
//   const userToBeUpdated = userToBeUpdatedId === id
//     ? user
//     : await UserModel.findByPk(userToBeUpdatedId);

//   ForbiddenError.from(ability).throwUnlessCan('update', subject('User', userToBeUpdated));
//   await UserModel.update(changes, {
//     where: {
//       id: userToBeUpdated.id,
//     },
//   });
// }

// await updateUserDetails(1, 1, { username: 'sobird' });
// // await updateUserDetails(2, 1, { username: 'sobird' });

// const users = await UserModel.findAll();
// console.log('users', users);

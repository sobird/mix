// const rows = await User.findAll({ include: [User.associations.Roles] });
// console.log('rows', rows[0].Roles[0].get());

import AbilityService from './ability';

vi.mock('@/models');

const ability = await AbilityService.createFor({ id: 1 });
console.log('ability', ability);

// export async function updateUserDetails(
//   /** email of a user who initiates the request (i.e., logged in user) */
//   id: string,
//   /** an email of user to be updated */
//   userToBeUpdatedId: string,
//   /** an object of changes to be applied */
//   changes: User,
// ) {
//   const user = await User.findByPk(id, { include: [User.associations.Roles] });
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
//     : await User.findByPk(userToBeUpdatedId);

//   ForbiddenError.from(ability).throwUnlessCan('update', subject('User', userToBeUpdated));
//   await User.update(changes, {
//     where: {
//       id: userToBeUpdated.id,
//     },
//   });
// }

// await updateUserDetails(1, 1, { username: 'sobird' });
// // await updateUserDetails(2, 1, { username: 'sobird' });

// const users = await User.findAll();
// console.log('users', users);

import { subject } from '@casl/ability';
import { cookies, headers } from 'next/headers';
import { getToken } from 'next-auth/jwt';
import { getCsrfToken } from 'next-auth/react';

import {
  LoginButton,
  LogoutButton,
  ProfileButton,
  RegisterButton,
} from '@/components/buttons';
import { defineAbilityFor } from '@/lib/ability';
import {
  UserModel, SessionModel, AccountModel, sequelize,
} from '@/models';
import { getServerAuthToken } from '@/services/auth';

const HomePage = async () => {
  const token = await getServerAuthToken();
  console.log('getServerAuthToken', token);
  // await sequelize.sync({ force: true });
  // await UserModel.signup({
  //   username: 'sobird',
  //   password: 'sobird',
  //   email: 'sobird@126.com',
  // });
  // console.log('res', res);

  // const session = await SessionModel.findAll({ raw: true });
  // console.log('session', session);

  const ability = defineAbilityFor(token);
  ability.update([
    // {
    //   action: 'create',
    //   subject: 'User',
    // },
    {
      action: 'read',
      subject: '/test',
    },
  ]);

  console.log('ability', ability);

  console.log('ability', ability.can('read', '/test'));

  const users = await UserModel.findAll({ include: [UserModel.associations.Roles] });
  console.log('users', users[0]);

  return (
    <main
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '70vh',
      }}
    >
      <div>
        <LoginButton />
        <RegisterButton />
        <LogoutButton />
        <ProfileButton />
      </div>
    </main>
  );
};

export default HomePage;

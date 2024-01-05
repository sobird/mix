import { subject } from '@casl/ability';
import { getToken } from 'next-auth/jwt';
import { cookies, headers } from 'next/headers';
import { getCsrfToken } from 'next-auth/react';
import {
  LoginButton,
  LogoutButton,
  ProfileButton,
  RegisterButton,
} from '@/components/buttons';

import {
  UserModel, SessionModel, AccountModel, sequelize,
} from '@/models';

import { defineAbilityFor } from '@/lib/ability';
import { getServerAuthToken } from '@/lib/auth';

const HomePage: IAppPage<{ id: string }> = async () => {
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

  console.log('ability', ability.can('read', '/test1'));

  const users = await UserModel.findAll({ raw: true });
  console.log('users', users);

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

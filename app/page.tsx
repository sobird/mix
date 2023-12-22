import {
  LoginButton,
  LogoutButton,
  ProfileButton,
  RegisterButton,
} from '@/components/buttons';

import {
  UserModel, SessionModel, AccountModel, sequelize,
} from '@/models';

export default async function Home() {
  // await sequelize.sync({ force: true });
  // await UserModel.signup({
  //   username: 'sobird',
  //   password: 'sobird',
  //   email: 'sobird@126.com',
  // });
  // console.log('res', res);

  const session = await SessionModel.findAll({ raw: true });
  console.log('session', session);

  const account = await AccountModel.findAll({ raw: true });
  console.log('account', account);

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
}

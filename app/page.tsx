import {
  LoginButton,
  LogoutButton,
  ProfileButton,
  RegisterButton,
} from '@/components/buttons';

import {
  UserModel, sequelize,
} from '@/models';

export default async function Home() {
  // await sequelize.sync({ force: true });
  // await UserModel.signup({
  //   username: 'sobird',
  //   password: 'sobird',
  //   email: 'sobird@126.com',
  // });
  // console.log('res', res);

  const user = await UserModel.findAll({ raw: true });
  console.log('user', user);

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

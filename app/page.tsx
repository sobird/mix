import {
  LoginButton,
  LogoutButton,
  ProfileButton,
  RegisterButton,
} from '@/components/buttons';

import {
  UserModel, RoleModel, AccountModel, sequelize,
} from '@/models';

export default async function Home() {
  // await sequelize.sync({ force: true });
  // AccountModel.create({
  //   provider: 'ddd',
  //   providerAccountId: 'ddddd',
  //   type: 'oauth',
  //   userId: 123,
  // });
  const user = await AccountModel.findAll({ raw: true });
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

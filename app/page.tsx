import {
  LoginButton,
  LogoutButton,
  ProfileButton,
  RegisterButton,
} from '@/components/buttons';

import { UserModel, RoleModel } from '@/models';

export default async function Home() {
  await UserModel.sync({ force: true });
  const user = await UserModel.findAll({ raw: true });
  // console.log('user', user);
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

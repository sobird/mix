import { subject } from '@casl/ability';
import {
  LoginButton,
  LogoutButton,
  ProfileButton,
  RegisterButton,
} from '@/components/buttons';

import {
  UserModel, SessionModel, AccountModel, sequelize,
} from '@/models';

import { defineAbilitiesFor } from '@/lib/ability';

const HomePage: IAppPage<{ id: string }> = async () => {
  // await sequelize.sync({ force: true });
  // await UserModel.signup({
  //   username: 'sobird',
  //   password: 'sobird',
  //   email: 'sobird@126.com',
  // });
  // console.log('res', res);

  // const session = await SessionModel.findAll({ raw: true });
  // console.log('session', session);

  // const account = await AccountModel.findAll({ raw: true });
  // console.log('account', account);

  console.log('sequelize.models', sequelize.models);
  console.log('UserModel', UserModel.getAttributes());

  const user2 = await UserModel.findOne({
    where: {
      id: 3,
    },
    raw: true,
  });

  const user = {
    id: 3,
    isAdmin: false,
    role: 'admin',
  };

  const ability = defineAbilitiesFor(user);
  console.log('ability', ability.can('create', subject('User', user2)));

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

import {
  AbilityBuilder, createMongoAbility, ForbiddenError, defineAbility,
} from '@casl/ability';
import { rulesToFields } from '@casl/ability/extra';
import {
  LoginButton,
  LogoutButton,
  ProfileButton,
  RegisterButton,
} from '@/components/buttons';

import {
  UserModel, SessionModel, AccountModel, sequelize,
} from '@/models';

class Post {
  title: string;

  content = '';

  author: number;

  isPublished: boolean;

  constructor(title: string, author: number) {
    this.title = title;
    this.author = author;
    this.isPublished = false;
  }
}

/**
 * @param user contains details about logged in user: its id, name, email, etc
 */
function defineAbilitiesFor(user) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (user.isAdmin) {
    can('manage', 'all');
  } else {
    can('read', 'Post');
    can('update', 'Post', ['content'], { author: user.id });
    cannot('delete', 'Post', {
      createdAt: { $lt: Date.now() - 24 * 60 * 60 * 1000 },
    }).because('Only admins can delete posts!');
  }

  return build();
}

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

  // const user = await UserModel.findOne({
  //   where: {
  //     id: 3,
  //   },
  //   raw: true,
  // });

  const user = {
    id: 1,
    isAdmin: false,
  };

  const post = new Post('my post', 1);

  const ability = defineAbilitiesFor(user);

  // console.log('ability', ability);

  console.log(ability.can('read', post));

  const isAllowed = ability.can('update', post, 'content');
  console.log('isAllowed', isAllowed);

  // you can even throw an error if there is a missed ability
  // ForbiddenError.from(ability).throwUnlessCan('delete', post);

  const ability2 = defineAbility((can, cannot) => {
    can('read', UserModel, { id: 1 });
    cannot('delete', UserModel);
  });
  const users = await UserModel.accessibleBy(ability2);
  // console.log('users', users);

  const ArticleAbility = defineAbility((can) => {
    can('read', 'Article', { authorId: 1 });
    can('read', 'Article', { public: true });
    can('read', 'Article', { title: { $regex: /^\[Draft\]/i } });
  });

  const defaultValues = rulesToFields(ability2, 'read', UserModel);
  console.log('defaultValues', defaultValues);
  const query = rulesToFields(ability2, 'read', UserModel);
  console.log('query', query);

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

/**
 * 权限创建页面
 *
 * sobird<i@sobird.me> at 2025/03/16 20:39:29 created.
 */

import { createUserAction } from '@/actions/user';
import UserForm from '@/app/dashboard/user/components/user-form';

const Page: AppPage = () => {
  return (
    <div>
      <UserForm action={createUserAction} />
    </div>
  );
};

export default Page;

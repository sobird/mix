/**
 * 服务器组件
 *
 * @see https://zh-hans.react.dev/reference/rsc/server-components
 *
 * sobird<i@sobird.me> at 2025/03/13 0:05:19 created.
 */

import { sleep } from '@/utils';

import Button from './Button';
import EmptyNote from './EmptyNote';
import UpdateName from './UpdateName';
import UpdateName2 from './UpdateName2';
import UpdateName3 from './UpdateName3';

async function createNoteAction() {
  // Server Function

  'use server';

  await sleep(1000, 'this is result');
}

export default function Page() {
  return (
    <div>
      <h1>Server Functions</h1>
      <h3>Creating a Server Function from a Server Component</h3>
      <Button onClick={createNoteAction} />

      <h3>Importing Server Functions from Client Components</h3>
      <EmptyNote />

      <h3>Server Functions with Actions</h3>
      <p>Server Functions can be called from Actions on the client:</p>
      <UpdateName />

      <h3>Server Functions with Form Actions</h3>
      <UpdateName2 />

      <h3>Server Functions with useActionState</h3>
      <UpdateName3 />
    </div>
  );
}

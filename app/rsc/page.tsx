/**
 * 服务器组件
 *
 * @see https://zh-hans.react.dev/reference/rsc/server-components
 *
 * sobird<i@sobird.me> at 2025/03/13 0:05:19 created.
 */

import Button from './Button';

async function createNoteAction() {
  // Server Function

  'use server';

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: [123] });
    }, 1000);
  });
}

export default function TestPage() {
  return (
    <div>
      isPending:
      <Button onClick={createNoteAction} />
    </div>
  );
}

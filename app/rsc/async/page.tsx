/**
 * 使用服务器组件的异步组件
 *
 * 服务器组件引入了一种使用 async/await 编写组件的新方法。当你在一个异步组件里 await 时，React 会暂停，等待 promise 解析完成后再继续渲染。
 * 这种等待可以跨越服务器和客户端的边界生效，并且支持 Suspense 的流式传输。
 * 你甚至可以在服务器上创建一个 promise，然后再客户端上 await 它。
 *
 * sobird<i@sobird.me> at 2025/03/13 1:42:49 created.
 */

import { Suspense } from 'react';

import { ClientComponent } from './ClientComponent';

export default async function Page() {
  // const result = await fetch('http://localhost:3000/api/rsc').then((data) => {
  //   return data.json();
  // }).then((data) => {
  //   return data;
  // });

  // 注意: 没有使用 await, 所以从这里开始执行，但是客户端上面进行 await
  const clientPromise = fetch('http://localhost:3000/api/rsc').then((data) => {
    return data.json();
  }).then((data) => {
    return data;
  });

  return (
    <div>
      {/* url:
      {result.url} */}

      <Suspense fallback={<p>Loading Client Component...</p>}>
        <ClientComponent clientPromise={clientPromise} />
      </Suspense>
    </div>
  );
}

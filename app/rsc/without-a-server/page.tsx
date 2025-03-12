/**
 * 不使用服务器的服务器组件
 *
 * 使用服务器组件，你可以在构建时一次性渲染这些组件：
 *
 * sobird<i@sobird.me> at 2025/03/13 1:00:12 created.
 */

import fs from 'node:fs';

export default async function Page() {
  const content = fs.readFileSync('README.md');
  return <div>{content.toString()}</div>;
}

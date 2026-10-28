'use client';

import { use } from 'react';

export function ClientComponent({ clientPromise }) {
  // 注意: 这样做会复用服务器上的 promise
  // 它会一直等到数据可用之后才继续
  const result = use<{ url: string }>(clientPromise);
  return (
    <div>
      Client Compoent:
      {' '}
      {result.url}
    </div>
  );
}

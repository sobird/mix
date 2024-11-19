/**
 * AntdRegistry.tsx
 *
 * @see https://ant.design/docs/react/use-with-next
 * sobird<i@sobird.me> at 2023/11/28 16:02:58 created.
 */

'use client';

import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';
import React from 'react';

import type Entity from '@ant-design/cssinjs/es/Cache';

const StyledComponentsRegistry = ({ children }: React.PropsWithChildren) => {
  const cache = React.useMemo<Entity>(() => { return createCache(); }, []);
  const isServerInserted = React.useRef<boolean>(false);
  useServerInsertedHTML(() => {
    // 避免 css 重复插入
    if (isServerInserted.current) {
      return;
    }
    isServerInserted.current = true;
    // eslint-disable-next-line react/no-danger
    return <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />;
  });
  return <StyleProvider cache={cache}>{children}</StyleProvider>;
};

export default StyledComponentsRegistry;
